import * as functions from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';
import { JiraClient } from './client';
import { JiraIntegration, JiraResource } from './types';
import { getSessionVariable } from '../zoom/routes';
import { getHost } from '../config';

export async function startJiraAuthFlow(
  req: functions.Request,
  res: functions.Response
) {
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send('Not signed in.');
  }

  const client = new JiraClient();
  await client.initializeClient();

  const redirectUrl = client.authorize(req, res);
  return res.redirect(redirectUrl);
}

export async function onJiraAuthorizationReceived(
  req: functions.Request,
  res: functions.Response
) {
  const client = new JiraClient();
  await client.initializeClient();
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send('Not signed in.');
  }

  const tokenSet = await client.getToken(req, res);

  const availableResources: JiraResource[] = await axios
    .get('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        Authorization: 'Bearer ' + tokenSet.access_token,
      },
    })
    .then((response) => response.data);

  console.log('JIRA resources', availableResources);

  const jiraResources: JiraResource[] = availableResources.filter((resource) =>
    resource.scopes.includes('read:jira-work')
  );

  if (!jiraResources.length) {
    res.status(404).json({ message: 'No JIRA resources found.' });
    return;
  }

  jiraResources.forEach(jiraResource => jiraResource.active = false);
  jiraResources[0].active = true;

  const firestore = getFirestore();
  const collection = firestore.collection(`userDetails/${userId}/integrations`);
  const integration: JiraIntegration = {
    provider: 'jira',
    createdAt: Timestamp.now(),
    accessToken: tokenSet.access_token!,
    refreshToken: tokenSet.refresh_token!,
    expiresAt: tokenSet.expires_at!,
    id: collection.doc().id,
    jiraResources,
  };

  await collection.doc('jira').set(integration);

  res.status(200).redirect(getHost(req) + '/integration/success');
}

export async function getUserId(
  req: functions.Request,
  res: functions.Response
): Promise<string | false> {
  const tokenId =
    getSessionVariable(req, res, false) ??
    req.get('Authorization')?.split('Bearer ')[1];
  if (!tokenId) {
    console.error('ID token not found');
    return false;
  }

  console.log('token', tokenId);

  return getAuth()
    .verifyIdToken(tokenId)
    .then((idToken) => idToken.uid)
    .catch((error) => {
      console.error(error);
      return false;
    });
}
