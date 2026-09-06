import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router'
import { Subscription } from 'rxjs'
import * as _ from 'lodash'
import { BasicInfoComponent } from '../../dialogs/basic-info/basic-info.component'

@Component({
  selector: 'ws-app-comprehensive-assessments',
  templateUrl: './comprehensive-assessments.component.html',
  styleUrls: ['./comprehensive-assessments.component.scss'],
  standalone: false,
})
export class ComprehensiveAssessmentsComponent implements OnInit, OnDestroy {

  userProfile: any
  userEmail = ''
  /** Drives which tab link is highlighted, the list itself reads it off its own route. */
  currentRoute = 'live'
  private routeSubscription: Subscription = new Subscription()

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userProfile = _.get(this.activatedRoute, 'snapshot.data.configService.userProfile')
    this.userEmail = _.get(this.activatedRoute, 'snapshot.data.configService.userProfileV2.email', '')
    this.updateCurrentRoute()
    this.routeSubscription = this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentRoute()
      }
    })
  }

  updateCurrentRoute(): void {
    const urlSegments = this.router.url.split('?')[0].split('/')
    this.currentRoute = urlSegments[urlSegments.length - 1]
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe()
    }
  }

  openBasicInfoDialog() {
    const dialogRef = this.dialog.open(BasicInfoComponent, {
      panelClass: 'create-comprehensive-assessment-dialog',
      data: {
        userProfile: this.userProfile,
        userEmail: this.userEmail,
      },
    })

    dialogRef.afterClosed().subscribe((identifier: any) => {
      if (identifier) {
        // preview/editMode are read by @sunbird-cb/toc off the url to pick its draft aware
        // hierarchy endpoint, mode stays first so its `&preview=true` check matches
        this.router.navigate(['/app/home/comprehensive-assessment/edit', identifier], {
          // a freshly created assessment is a draft, so Back from it lands on the Draft tab
          queryParams: { mode: 'edit', preview: 'true', editMode: 'true', pathUrl: 'draft' },
        })
      }
    })
  }

}
