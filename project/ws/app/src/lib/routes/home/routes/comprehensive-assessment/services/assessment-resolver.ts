import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot } from '@angular/router'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import * as _ from 'lodash'
import { ComprehensiveAssessmentService } from './comprehensive-assessment.service'

@Injectable()
export class AssessmentResolverService {

  constructor(private assessmentSvc: ComprehensiveAssessmentService) { }

  resolve(activatedRoute: ActivatedRouteSnapshot): Observable<any> {
    const assessmentId = _.get(activatedRoute, 'params.assessmentId', '').replace(':', '')
    if (!assessmentId) {
      return of({ data: null, error: 'No assessment id found' })
    }
    return this.assessmentSvc.getContentHierarchy(assessmentId).pipe(
      map((res: any) => ({ data: _.get(res, 'result.content'), error: null })),
      catchError((err: any) => of({ data: null, error: err }))
    )
  }
}
