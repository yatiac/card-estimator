import { Component, Inject, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { SerializerService } from 'src/app/services/serializer.service';
import {
  CardSetValue,
  MemberType,
  Room,
  Round,
  RoundStatistics,
} from 'src/app/types';
import { TopicEditorInputOutput } from '../topic-editor/topic-editor.component';
import { MatDialog } from '@angular/material/dialog';
import { summaryModalCreator } from '../summary-modal/summary-modal.component';

@Component({
  selector: 'app-topics-sidebar',
  templateUrl: './topics-sidebar.component.html',
  styleUrls: ['./topics-sidebar.component.scss'],
})
export class TopicsSidebarComponent implements OnInit {
  @Input() room: Room;
  @Input() rounds: Round[];
  @Input() currentRound: number;
  @Input() roundStatistics: RoundStatistics[];
  @Input() selectedEstimationCardSetValue: CardSetValue | undefined;

  isAddingRound = false;
  editedRound = new BehaviorSubject<
    { round: Round; roundIndex: number } | undefined
  >(undefined);

  readonly MemberType = MemberType;
  constructor(
    private serializer: SerializerService,
    private analytics: AnalyticsService,
    private estimatorService: EstimatorService,
    private readonly dialog: MatDialog,
    public readonly permissionsService: PermissionsService,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit(): void {}

  downloadAsCsv() {
    this.analytics.logClickedDownloadResults();
    this.serializer.exportRoomAsCsv(this.room);
  }

  revoteRound(roundNumber: number) {
    this.analytics.logClickedReVote();
    this.estimatorService.setActiveRound(this.room, roundNumber, true);
  }

  addRound() {
    this.isAddingRound = true;
    window.setTimeout(() => {
      const drawer = document.querySelector('.mat-drawer-inner-container');
      drawer?.scrollTo({ top: drawer?.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  cancelAddingRound() {
    this.isAddingRound = false;
  }

  async updateRoundConfirmed(props: TopicEditorInputOutput) {
    if (this.editedRound.value) {
      await this.estimatorService.setTopic(
        this.room,
        this.editedRound.value.roundIndex,
        props.topic,
        props.richTopic
      );
      this.editedRound.next(undefined);
    }
  }

  async addRoundConfirmed(props: TopicEditorInputOutput) {
    await this.estimatorService.addRound(
      this.room,
      props.topic,
      props.richTopic
    );
    this.analytics.logClickedAddRoundConfirmed();
    this.isAddingRound = false;
  }

  setActiveRound(roundNumber: number) {
    this.analytics.logClickedSetActiveRound();
    this.estimatorService.setActiveRound(this.room, roundNumber, false);
  }

  openSummaryModal() {
    this.dialog.open(...summaryModalCreator({ roomId: this.room.roomId }));
    this.analytics.logClickedSummarize();
  }
}
