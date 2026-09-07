import { Injectable } from '@angular/core'
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http'
import { Observable } from 'rxjs'

/** The content id sits between the hierarchy path and the query string */
const COURSE_HIERARCHY_URL = /course\/v1\/hierarchy\/([^/?]+)/
/** Same endpoint the comprehensive assessment service reads its draft with */
const DRAFT_HIERARCHY_URL = (contentId: string) =>
  `apis/proxies/v8/action/content/v3/hierarchy/${contentId}?mode=edit`
const ASSESSMENT_BUILDER_ROUTE = '/comprehensive-assessment/'

/**
 * The comprehensive assessment builder previews its draft with `ws-app-app-toc-home-v2`. That
 * component does not render the content it is handed, it re-reads the hierarchy itself, and the
 * url it reads from is picked in the library from `window.location.href` alone:
 *
 *   `&preview=true` + `editMode=true` -> `course/v1/hierarchy/{id}?mode=edit`
 *
 * A comprehensive assessment is authored through `action/content/v3` and a draft of one is not
 * served by the course reader, so that read answers 404 and the preview stays blank. The read is
 * pointed here at the endpoint that does serve the draft. Both answer `result.content`, so the
 * component gets the shape it expects.
 *
 * Only reads made from the assessment builder are touched, the course reader is left alone
 * everywhere else. This can go once the library takes the content it is given, or lets the
 * endpoint be passed in.
 */
@Injectable({
  providedIn: 'root',
})
export class CaHierarchyInterceptorService implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const contentId = this.draftHierarchyContentId(req)
    if (!contentId) {
      return next.handle(req)
    }
    return next.handle(req.clone({ url: DRAFT_HIERARCHY_URL(contentId) }))
  }

  /** The content id of a course hierarchy read made from the assessment builder, else '' */
  private draftHierarchyContentId(req: HttpRequest<any>): string {
    if (req.method !== 'GET' || !this.isOnAssessmentBuilder()) {
      return ''
    }
    const match = COURSE_HIERARCHY_URL.exec(req.url)
    return (match && match[1]) ? match[1] : ''
  }

  private isOnAssessmentBuilder(): boolean {
    return (typeof window !== 'undefined') &&
      window.location.pathname.includes(ASSESSMENT_BUILDER_ROUTE)
  }
}
