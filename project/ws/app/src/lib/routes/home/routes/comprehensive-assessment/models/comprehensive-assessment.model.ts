/**
 * Content categories used while creating the "Comprehensive assessment" collection.
 * The collection itself is created as a `Standalone Assessment` content, the
 * question set built in step 2 is created as a `Course Assessment` question set.
 */
export const CONTENT_PRIMARY_CATEGORY = 'Standalone Assessment'
export const CONTENT_COURSE_CATEGORY = 'Standalone Assessment'
export const COLLECTION_MIME_TYPE = 'application/vnd.ekstep.content-collection'
export const QUESTIONSET_MIME_TYPE = 'application/vnd.sunbird.questionset'
export const QUESTIONSET_PRIMARY_CATEGORY = 'Course Assessment'
export const DEFAULT_ACCESS_SETTING = 'allUsers'
export const DEFAULT_FRAMEWORK = 'igot'
export const DEFAULT_LICENSE = 'CC BY 4.0'

export const noSpecialCharAssessment = new RegExp(
  /^[ऀ-ॿঀ-৿ఀ-౿஀-௿ಀ-೿ഀ-ൿ઀-૿଀-୿਀-੿a-zA-Z0-9\(\)\$\[\]\.\-,:!'\" _\/]*$/ // NOSONAR
)

export namespace comprehensiveAssessment {
  /** Config contract expected by `sb-uic-assessment-main` of `@sunbird-cb/consumption` */
  export interface IAssessmentConfig {
    identifier: string
    primaryCategory: string
    contextCategory: string
    isReadOnly: boolean
  }

  export const IMAGE_MAX_SIZE = (500 * 1024)
  export const NAME_MIN_LENGTH = 10
  export const NAME_MAX_LENGTH = 70
  export const DESCRIPTION_MIN_LENGTH = 250
  export const DESCRIPTION_MAX_LENGTH = 2000
  export const LEARNING_OUTCOME_MAX_LENGTH = 2000
}

export namespace comprehensiveAssessmentList {
  /** Status values the listing tabs map onto, as indexed by the composite search. */
  export const STATUS_LIVE = 'Live'
  export const STATUS_DRAFT = 'Draft'
  export const DEFAULT_PAGE_SIZE = 20

  export interface columnData {
    displayName: string
    key: string
    cellType: string
    imageKey?: string
    cellClass?: string
  }

  export interface tableData {
    columns: columnData[]
    showSearchBox: boolean
    showPagination: boolean
    noDataMessage?: string
  }

  export interface pagination {
    startIndex: number
    lastIndex: number
    pageSize: number
    pageIndex: number
    totalCount: number
  }

  export interface menuItems {
    icon?: string
    btnText: string
    action: string
  }

  /** Fields the listing needs back from the search, everything else is dropped by the api. */
  export const SEARCH_FIELDS = [
    'name',
    'appIcon',
    'posterImage',
    'status',
    'primaryCategory',
    'courseCategory',
    'contentType',
    'mimeType',
    'duration',
    'creator',
    'createdBy',
    'createdFor',
    'createdOn',
    'lastUpdatedOn',
    'lastPublishedOn',
    'versionKey',
  ]
}
