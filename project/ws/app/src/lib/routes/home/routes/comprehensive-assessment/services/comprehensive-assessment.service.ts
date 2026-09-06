import { DatePipe } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'
import * as _ from 'lodash'
import { environment } from '../../../../../../../../../../src/environments/environment'
import {
  COLLECTION_MIME_TYPE, CONTENT_COURSE_CATEGORY, CONTENT_PRIMARY_CATEGORY, DEFAULT_ACCESS_SETTING,
  DEFAULT_FRAMEWORK, DEFAULT_LICENSE, QUESTIONSET_MIME_TYPE, comprehensiveAssessmentList,
} from '../models/comprehensive-assessment.model'

const API_END_POINTS = {
  CREATE_CONTENT: 'apis/proxies/v8/action/content/v3/create',
  UPLOAD_CONTENT: 'apis/proxies/v8/upload/action/content/v3/upload',
  CONTENT_HIERARCHY_EDIT: (contentId: string) => `apis/proxies/v8/action/content/v3/hierarchy/${contentId}?mode=edit`,
  UPDATE_CONTENT: (contentId: string) => `apis/proxies/v8/action/content/v3/update/${contentId}`,
  CONTENT_HIERARCHY_UPDATE: 'apis/proxies/v8/action/content/v3/hierarchy/update',
  QUESTIONSET_HIERARCHY_EDIT: (questionSetId: string) => `apis/proxies/v8/questionset/v1/hierarchy/${questionSetId}?mode=edit`,
  CONTENT_SEARCH: 'apis/proxies/v8/sunbirdigot/v4/search',
  PUBLISH_CONTENT: (contentId: string) => `apis/proxies/v8/action/content/v3/publish/${contentId}`,
  RETIRE_CONTENT: (contentId: string) => `apis/proxies/v8/action/content/v3/retire/${contentId}`,
}

const STORAGE_URL_TO_REPLACE = 'https://storage.googleapis.com/igot'

@Injectable()
export class ComprehensiveAssessmentService {

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) { }

  //#region (content apis)

  createContent(req: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.CREATE_CONTENT, req)
  }

  uploadContent(contentId: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${API_END_POINTS.UPLOAD_CONTENT}/${contentId}`, formData)
  }

  getContentHierarchy(contentId: string): Observable<any> {
    return this.http.get<any>(API_END_POINTS.CONTENT_HIERARCHY_EDIT(contentId))
  }

  updateContent(contentId: string, content: any): Observable<any> {
    return this.http.patch<any>(API_END_POINTS.UPDATE_CONTENT(contentId), { request: { content } })
  }

  /**
   * Links the question set built in step 2 as a child of the assessment collection so that
   * re-opening a draft (and the step 3 preview) can find it back from the content hierarchy.
   */
  linkAssessmentToCollection(collection: any, assessmentId: string): Observable<any> {
    const rootId = _.get(collection, 'identifier', '')
    const existingChildren: string[] = _.map(_.get(collection, 'children', []), (child: any) => child.identifier)
    const children = _.uniq([...existingChildren, assessmentId])
    const requestBody = {
      request: {
        data: {
          nodesModified: {
            [rootId]: {
              isNew: false,
              root: true,
              metadata: {},
            },
          },
          hierarchy: {
            [rootId]: {
              children,
              name: _.get(collection, 'name', ''),
              contentType: _.get(collection, 'contentType', 'Collection'),
              primaryCategory: _.get(collection, 'primaryCategory', CONTENT_PRIMARY_CATEGORY),
              root: true,
            },
          },
        },
      },
    }
    return this.http.patch<any>(API_END_POINTS.CONTENT_HIERARCHY_UPDATE, requestBody)
  }

  /**
   * Lists the org's comprehensive assessments for one status tab. The collection and the
   * question set built inside it are indexed separately, so the collection mimeType filter
   * is what keeps the linked question sets out of the listing.
   */
  searchAssessments(params: {
    status: string,
    rootOrgId: string,
    query: string,
    pageSize: number,
    pageIndex: number
  }): Observable<{ content: any[], count: number }> {
    const request = {
      locale: ['en'],
      request: {
        // a search always restarts at the first page, the offset belongs to the browsed list
        query: params.query || '',
        limit: params.pageSize,
        offset: params.query ? 0 : params.pageSize * params.pageIndex,
        fields: comprehensiveAssessmentList.SEARCH_FIELDS,
        filters: {
          status: [params.status],
          courseCategory: [CONTENT_COURSE_CATEGORY],
          mimeType: [COLLECTION_MIME_TYPE],
          createdFor: [params.rootOrgId],
        },
        sort_by: { lastUpdatedOn: 'desc' },
      },
    }

    return this.http.post<any>(API_END_POINTS.CONTENT_SEARCH, request).pipe(
      map((res: any) => ({
        content: _.map(_.get(res, 'result.content', []), (row: any) => this.toListRow(row)),
        count: _.get(res, 'result.count', 0),
      }))
    )
  }

  /** Moves a draft collection to Live. */
  publishAssessment(contentId: string, userId: string): Observable<any> {
    return this.http.post<any>(API_END_POINTS.PUBLISH_CONTENT(contentId), {
      request: { content: { lastPublishedBy: userId } },
    })
  }

  /** Retire is the delete the content api offers, the row leaves every status tab. */
  retireAssessment(contentId: string): Observable<any> {
    return this.http.delete<any>(API_END_POINTS.RETIRE_CONTENT(contentId))
  }

  //#endregion

  //#region (question set apis)

  getQuestionSetHierarchy(questionSetId: string): Observable<any> {
    return this.http.get<any>(API_END_POINTS.QUESTIONSET_HIERARCHY_EDIT(questionSetId)).pipe(
      map((response: any) => _.get(response, 'result.questionSet', {}))
    )
  }

  //#endregion

  //#region (helpers)

  /** Shapes a search hit into the flat, display ready row the listing table renders. */
  private toListRow(row: any): any {
    return {
      ...row,
      createdOn: this.toDisplayDate(_.get(row, 'createdOn')),
      lastUpdatedOn: this.toDisplayDate(_.get(row, 'lastUpdatedOn')),
      lastPublishedOn: this.toDisplayDate(_.get(row, 'lastPublishedOn')),
      creator: _.get(row, 'creator', '') || '-',
      durationDisplay: this.toDisplayDuration(Number(_.get(row, 'duration', 0)) || 0),
    }
  }

  private toDisplayDate(value: any): string {
    return value ? (this.datePipe.transform(value, 'dd MMM, yyyy') || '') : ''
  }

  /** Same hr/min shape the basic details step shows, the api stores duration in seconds. */
  private toDisplayDuration(duration: number): string {
    if (!duration || duration <= 0) {
      return '-'
    }
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const parts: string[] = []
    if (hours > 0) {
      parts.push(`${hours} hr`)
    }
    if (minutes > 0) {
      parts.push(`${minutes} min`)
    }
    return parts.length ? parts.join(' ') : `${Math.floor(duration)} sec`
  }

  /**
   * Creates an `Asset` content for the picked image, uploads the file against it and
   * resolves with the public artifact url to be used as appIcon / posterImage.
   */
  uploadImageAsset(file: File, userProfile: any): Observable<string> {
    const request = {
      request: {
        content: {
          code: this.generateCode(),
          contentType: 'Asset',
          createdBy: _.get(userProfile, 'userId', ''),
          creator: _.get(userProfile, 'userName', ''),
          mimeType: file.type,
          mediaType: 'image',
          name: file.name,
          language: ['English'],
          license: DEFAULT_LICENSE,
          primaryCategory: 'Asset',
          organisation: [_.get(userProfile, 'departmentName', '')],
          createdFor: [_.get(userProfile, 'rootOrgId', '')],
        },
      },
    }

    return this.createContent(request).pipe(
      mergeMap((res: any) => {
        const contentId = _.get(res, 'result.identifier', '')
        if (!contentId) {
          return throwError(() => new Error('Something went wrong while creating the image asset'))
        }
        const formData: FormData = new FormData()
        formData.append('data', file)
        return this.uploadContent(contentId, formData).pipe(
          map((fdata: any) => this.toPublicUrl(_.get(fdata, 'result.artifactUrl', '')))
        )
      })
    )
  }

  /** Creates the assessment collection with the name and thumbnail captured in the dialog. */
  createAssessmentCollection(name: string, appIcon: string, userProfile: any, userEmail: string): Observable<any> {
    const userId = _.get(userProfile, 'userId', '')
    const creator = _.get(userProfile, 'userName', '')
    const request = {
      request: {
        content: {
          appIcon,
          creator,
          name,
          posterImage: appIcon,
          code: this.generateCode(),
          contentType: 'Collection',
          createdBy: userId,
          creatorContacts: [{
            id: userId,
            name: creator,
            email: userEmail || _.get(userProfile, 'email', ''),
          }],
          creatorIDs: [userId],
          createdFor: [_.get(userProfile, 'rootOrgId', '')],
          framework: DEFAULT_FRAMEWORK,
          mimeType: COLLECTION_MIME_TYPE,
          organisation: [_.get(userProfile, 'departmentName', '')],
          isExternal: false,
          primaryCategory: CONTENT_PRIMARY_CATEGORY,
          courseCategory: CONTENT_COURSE_CATEGORY,
          license: DEFAULT_LICENSE,
          ownershipType: ['createdFor'],
          language: ['English'],
          accessSetting: DEFAULT_ACCESS_SETTING,
          versionKey: '1',
        },
      },
    }
    return this.createContent(request)
  }

  /** Picks the question set linked to the collection, if any. */
  getLinkedAssessmentId(collection: any): string {
    const children = _.get(collection, 'children', [])
    const questionSet = _.find(children, (child: any) => _.get(child, 'mimeType', '') === QUESTIONSET_MIME_TYPE)
    return _.get(questionSet, 'identifier', '')
  }

  /** Sunbird expects a 16 digit numeric code on create. */
  generateCode(): string {
    let code = ''
    // tslint:disable-next-line: no-increment-decrement
    for (let i = 0; i < 16; i++) {
      code += Math.floor(Math.random() * 10)
    }
    return code
  }

  /** Rewrites a raw storage url to the portal's public asset url. */
  toPublicUrl(createdUrl: string): string {
    if (createdUrl && createdUrl.startsWith(STORAGE_URL_TO_REPLACE)) {
      const urlSplice = createdUrl.slice(STORAGE_URL_TO_REPLACE.length).split('/')
      const domain = (environment.domainName || '').replace(/\/$/, '')
      return `${domain}/assets/public/${urlSplice.slice(1).join('/')}`
    }
    return createdUrl
  }

  //#endregion
}
