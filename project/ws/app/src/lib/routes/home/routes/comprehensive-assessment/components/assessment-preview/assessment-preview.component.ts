import { Component, Input } from '@angular/core'

/**
 * Step 3 of the builder.
 *
 * Note on the component choice: `ws-app-app-toc-home` is deliberately NOT exported by
 * `AppTocLibModule` in @sunbird-cb/toc (it is commented out of the module's exports) and
 * the installed build only declares a `forPreview` input on it, so it cannot be used from
 * here. `ws-app-app-toc-home-v2` is exported and reads `inputContent` when the route has
 * no resolved content, which is exactly the embedded preview case.
 */
@Component({
  selector: 'ws-app-assessment-preview',
  templateUrl: './assessment-preview.component.html',
  styleUrls: ['./assessment-preview.component.scss'],
  standalone: false,
})
export class AssessmentPreviewComponent {

  /** A full content hierarchy response, re-read from the api after the draft is saved. */
  @Input() content: any

}
