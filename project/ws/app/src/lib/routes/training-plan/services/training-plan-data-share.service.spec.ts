import { TrainingPlanDataSharingService } from './training-plan-data-share.service'

describe('TrainingPlanDataSharingService content list', () => {
  let svc: TrainingPlanDataSharingService
  beforeEach(() => { svc = new TrainingPlanDataSharingService() })

  it('tracks adds and removes', () => {
    svc.addContentToPlan('A'); svc.addContentToPlan('B')
    expect(svc.isContentSelected('A')).toBe(true)
    expect(svc.isContentSelected('B')).toBe(true)
    svc.removeContentFromPlan('A')
    expect(svc.isContentSelected('A')).toBe(false)
    expect(svc.isContentSelected('B')).toBe(true)
  })

  it('is not stale when a remove and an add keep the length the same', () => {
    svc.addContentToPlan('A'); svc.addContentToPlan('B')
    expect(svc.isContentSelected('A')).toBe(true)
    svc.removeContentFromPlan('A')
    svc.addContentToPlan('C')
    expect(svc.isContentSelected('A')).toBe(false)
    expect(svc.isContentSelected('C')).toBe(true)
    expect(svc.getContentIdentifiers()).toEqual(['B', 'C'])
  })

  it('sees the list being emptied from the outside', () => {
    svc.addContentToPlan('A')
    expect(svc.isContentSelected('A')).toBe(true)
    svc.trainingPlanStepperData.contentList = []
    expect(svc.isContentSelected('A')).toBe(false)
  })

  it('sees a same length list swapped in from the outside', () => {
    svc.addContentToPlan('A')
    expect(svc.isContentSelected('A')).toBe(true)
    svc.trainingPlanStepperData.contentList = [{ identifier: 'Z', mandatory: false }]
    expect(svc.isContentSelected('A')).toBe(false)
    expect(svc.isContentSelected('Z')).toBe(true)
  })

  it('keeps the mandatory flag and the payload shape', () => {
    svc.addContentToPlan('A'); svc.addContentToPlan('B')
    svc.setContentMandatory('B', true)
    expect(svc.isContentMandatory('A')).toBe(false)
    expect(svc.isContentMandatory('B')).toBe(true)
    expect(svc.getMandatoryContentCount()).toBe(1)
    expect(svc.buildContentListPayload(svc.getContentList())).toEqual([
      { identifier: 'A', mandatory: false },
      { identifier: 'B', mandatory: true },
    ])
  })

  it('reads plans saved as plain content ids', () => {
    svc.trainingPlanStepperData.contentList = ['A', 'B']
    expect(svc.isContentSelected('B')).toBe(true)
    expect(svc.isContentMandatory('B')).toBe(false)
    expect(svc.buildContentListPayload(svc.getContentList()))
      .toEqual([{ identifier: 'A', mandatory: false }, { identifier: 'B', mandatory: false }])
  })
})
