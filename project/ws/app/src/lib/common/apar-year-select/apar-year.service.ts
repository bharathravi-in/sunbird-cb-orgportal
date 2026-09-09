import { Injectable } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import moment from 'moment'
/* tslint:disable*/
import _ from 'lodash'
/* tslint:enable*/

export interface IAparYear {
  label: string
  value: string
  // Whether a plan can be set to this year. Authored per year in the global config, and only the
  // current year is open when the config says nothing: a past year is closed. A closed year is
  // kept on the list, the dashboard has to be able to filter the plans of that year
  editable?: boolean
  // The running cycle: the year the pickers land on by default, and the only one the list marks
  // as current. Authored as a flag on the year itself, never as text inside its label
  current?: boolean
}

@Injectable({
  providedIn: 'root',
})
export class AparYearService {
  private readonly defaultYearCount = 5
  // Owned here rather than authored into a label, so it always sits on the year holding the flag
  private readonly currentYearSuffix = '(Current A.Y.)'

  constructor(private configSvc: ConfigurationsService) { }

  // The year list is authored in the MDO global config (form read) and fetched on app init.
  // The count only applies to the financial year fallback used when that config is unavailable
  getAparYears(count: number = this.defaultYearCount): IAparYear[] {
    const configuredYears = this.getConfiguredAparYears()
    if (configuredYears.length) {
      return configuredYears
    }

    const currentCycleStart = this.getCurrentCycleStart()

    // Only the current cycle is open, the same as a config that closes the years behind it. The
    // current one always is, a plan is never left with no year it can be saved against
    return Array.from({ length: count }, (_item, index) => {
      const value = this.formatAparYear(currentCycleStart - index)
      return {
        label: this.composeLabel(value, index === 0),
        value,
        editable: index === 0,
        current: index === 0,
      }
    })
  }

  getCurrentAparYear(): string {
    const current = this.getConfiguredAparYears().find((year: IAparYear) => year.current)
    if (current) {
      return current.value
    }

    // The list can be left out of the config while the current year is authored on its own
    const currentYear = _.get(this.configSvc.globalConfig, 'cbpPlanYear.currentYear')
    if (currentYear) {
      return currentYear
    }

    return this.formatAparYear(this.getCurrentCycleStart())
  }

  // A year the config closes can still be filtered on the dashboard, but a plan cannot be set to
  // it. A year the config no longer lists is closed as well, it is only kept for the plans on it
  isAparYearEditable(year: string): boolean {
    if (!year) {
      return false
    }
    const match = this.getAparYears().find((item: IAparYear) => item.value === year)
    return Boolean(match && match.editable)
  }

  private getConfiguredAparYears(): IAparYear[] {
    const yearList = _.get(this.configSvc.globalConfig, 'cbpPlanYear.yearList')
    if (!Array.isArray(yearList)) {
      return []
    }

    const years = yearList.filter((year: any) => year && year.value)
    const currentValue = this.resolveCurrentValue(years)

    return years.map((year: any) => {
      const current = year.value === currentValue
      return {
        label: this.composeLabel(year.label || year.value, current),
        value: year.value,
        // A year the config says nothing about follows the current year, so the years behind it
        // are closed even before the flag is authored on them
        editable: _.isNil(year.editable) ? current : year.editable === true,
        current,
      }
    })
  }

  /**
   * Only one year of the list is the running cycle. The flag authored on a year decides, and the
   * cbpPlanYear.currentYear field is the fallback for a list that carries no flag at all, so a
   * config written before the flag existed keeps working. Failing both, the list leads with it.
   */
  private resolveCurrentValue(years: any[]): string {
    const flagged = years.find((year: any) => year.current === true)
    if (flagged) {
      return flagged.value
    }
    return _.get(this.configSvc.globalConfig, 'cbpPlanYear.currentYear') || _.get(years, '[0].value')
  }

  // The suffix belongs to whichever year is current, so one authored into a label is stripped
  // first: a config still carrying the old text does not end up labelled twice, or label a year
  // as current after the flag has moved on
  private composeLabel(label: string, current: boolean): string {
    const base = `${label}`.replace(/\s*\(\s*current\s+a\.?y\.?\s*\)\s*$/i, '').trim()
    return current ? `${base} ${this.currentYearSuffix}` : base
  }

  // The APAR cycle follows the financial year, so a new one starts every April
  private getCurrentCycleStart(): number {
    const today = moment()
    return today.month() >= 3 ? today.year() : today.year() - 1
  }

  private formatAparYear(startYear: number): string {
    return `${startYear}-${`${startYear + 1}`.slice(-2)}`
  }
}
