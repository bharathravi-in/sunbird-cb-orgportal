import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { MatCheckboxChange } from '@angular/material/checkbox'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */

@Component({
  selector: 'ws-app-gating-courses',
  templateUrl: './gating-courses.component.html',
  styleUrls: ['./gating-courses.component.scss'],
  standalone: false
})
export class GatingCoursesComponent implements OnChanges {
  // Every content selected on the plan, whichever page it was picked from
  @Input() contentData: any[] = []
  @Output() mandatoryChanged = new EventEmitter<any>()

  /* tslint:disable */
  infoText = 'Tick the courses a Karmayogi has to complete for the CA. The rest of the plan stays optional.'
  /* tslint:enable */
  selectedCourses: any[] = []
  mandatoryCount = 0

  constructor(private tpdsSvc: TrainingPlanDataSharingService) { }

  ngOnChanges() {
    this.buildSelectedCourses()
  }

  /**
   * The courses of the plan, in the order they were added. Read from the plan content list and not
   * from the search results, so a course picked on an earlier page is still listed here.
   */
  private buildSelectedCourses() {
    const contentById = _.keyBy(this.contentData || [], 'identifier')
    this.selectedCourses = this.tpdsSvc.getContentIdentifiers()
      .map((identifier: string) => contentById[identifier])
      .filter((content: any) => !!content)
    this.mandatoryCount = this.tpdsSvc.getMandatoryContentCount()
  }

  trackByIdentifier(_index: number, course: any): string {
    return course?.identifier
  }

  isMandatory(course: any): boolean {
    return this.tpdsSvc.isContentMandatory(course?.identifier)
  }

  onMandatoryChange(event: MatCheckboxChange, course: any) {
    if (!course || !course.identifier) {
      return
    }
    this.tpdsSvc.setContentMandatory(course.identifier, event.checked)
    this.mandatoryCount = this.tpdsSvc.getMandatoryContentCount()
    if (this.tpdsSvc.trainingPlanStepperData.status === 'Live') {
      this.tpdsSvc.isContentChanged = true
    }
    this.mandatoryChanged.emit(true)
  }
}
