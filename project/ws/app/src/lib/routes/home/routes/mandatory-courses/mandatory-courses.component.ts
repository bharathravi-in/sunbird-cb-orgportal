import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material'
import { ActivatedRoute } from '@angular/router'
import { AddFolderPopupComponent } from '../../../mandatory-courses/components/add-folder-popup/add-folder-popup.component'
import { MandatoryCourseService } from '../../../mandatory-courses/services/mandatory-course.service'
@Component({
  selector: 'ws-app-mandatory-courses',
  templateUrl: './mandatory-courses.component.html',
  styleUrls: ['./mandatory-courses.component.scss'],
})
export class MandatoryCoursesComponent implements OnInit {
  folderList: any = []
  constructor(private dialog: MatDialog, private activatedRoute: ActivatedRoute, private mandatoryCourseServices: MandatoryCourseService) {
  }

  ngOnInit() {
    this.mandatoryCourseServices.updatePageData(this.activatedRoute.snapshot.data.pageData.data)
    this.getFolderList()
  }

  openCreateFolderDialog() {
    console.log('popup btn clicked')
    this.dialog.open(AddFolderPopupComponent, {
      // height: '400px',
      width: '400px',

      // panelClass: 'custom-dialog-container',
    })
  }

  getFolderList() {
    const queryparam = {
      request: {
        filters: {
          contentType: ['Course'],
          primaryCategory: ['Mandatory Course Goal'],
          mimeType: [],
          source: [],
          mediaType: [],
          status: ['Draft'],
          topics: [],
        },
        query: '',
        sort_by: { lastUpdatedOn: 'desc' },
        fields: [],
        facets: ['primaryCategory'],
        limit: 100,
        offset: 0,
        fuzzy: true,
      },
    }
    this.mandatoryCourseServices.fetchSearchData(queryparam).subscribe(data => {
      this.folderList = data.result.content
    })
  }
}
