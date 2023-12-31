import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef
} from '@angular/core';
import {
  AbstractControl,
  FormGroup
} from '@angular/forms';
import { CrispyFormField, getCrispyFormHelper } from './crispy-mat-form-helper';
import { CrispyFieldProps, CrispyForm } from './crispy-types';
import { CRISPY_FORMS_CONFIG_PROVIDER } from './providers';

@Directive({
  selector: 'ng-template.[crispyFieldName]',
})
export class CrispyFieldNameDirective implements OnInit, OnDestroy {
  static _crispyFieldTemplates: Array<CrispyFieldNameDirective> = [];

  @Input()
  crispyFieldName!: string;

  constructor(public templateRef: TemplateRef<any>) {}

  ngOnInit(): void {
    CrispyFieldNameDirective._crispyFieldTemplates.push(this);
    // console.log(`CrispyFieldNameDirective.ngOnInit - field: ${this.crispyFieldName},_crispyFieldTemplates.length: ${CrispyFieldNameDirective._crispyFieldTemplates.length}`);
  }

  ngOnDestroy(): void {
    const index = CrispyFieldNameDirective._crispyFieldTemplates.findIndex(
      (f) => f.crispyFieldName.localeCompare(this.crispyFieldName) == 0,
      1
    );
    // console.log(`CrispyFieldNameDirective.ngOnDestroy(bf) - field: ${this.crispyFieldName}, _crispyFieldTemplates.length: ${CrispyFieldNameDirective._crispyFieldTemplates.length}, index: ${index}`);
    if (index !== -1) {
      CrispyFieldNameDirective._crispyFieldTemplates.splice(index, 1);
      // console.log(`CrispyFieldNameDirective.ngOnDestroy(af) - field: ${this.crispyFieldName}, _crispyFieldTemplates.length: ${CrispyFieldNameDirective._crispyFieldTemplates.length}`);
    }
  }
}


/**
 * `<app-crispy-mat-form>` is a component that makes creating & rendering angular
 * material forms a breeze. The component layers on top the excellent reactive
 * forms to create the required form fields and then layout them in a standardized
 * way such that application code only has to declare the fields of the form in an
 * array and pass this array to the component as an input argument.
 * 
 * To illustrate with an example:
 * 
 * `<app-crispy-mat-form [cffs]="cffs"> </app-crispy-mat-form>`
 * 
 * where `cffs` is defined as:
 * 
 * ```
 *   @ViewChild(CrispyFormComponent) crispyForm: CrispyFormComponent;
 *   ...
 *   ...
 *   ngOnInit() {
 *     this.cffs = [
 *       crispyTextField('firstName', 'Peter', Validators.required, 'pe-2 w-50'),
 *       crispyTextField('lastName', 'Parker', Validators.required, 'w-50'),
 *     ]
 *   }
 * ```
 * This will create a form with two fields, `firstName` & `lastName` arranged side by side.
 * Note that in the example, the css classes used come from Bootstrap and it's these classes
 * that provide the side-by-side single-line layout in the form.
 * 
 * Then in the submit handler you can:
 * 
 *   ```
 *   onSubmit() {
 *     const values = this.crispyForm.form.value;
 *     // send the value to the service or use it as data in HttpClient.post().
 *   }
 *   ```
 * 
 * Behind the scenes crispy form works via the structure
 * ```
 * interface CrispyForm {
 *    form: FormGroup;
 *    fields: CrispyFieldProps[];
 * }
 * ```
 * Whereas `form` is the obvious angular's reactive form FormGroup object,
 * `fields` member provides the layout instructions for the individual fields
 * defined in `form`.
 * 
 * To ease the process of composing these two values separately, the library
 * includes a bunch of helper functions that allows you declare the `form` and
 * the `fields` values via a single declaration. What you see in the first
 * example above is code written using these helper functions.
 * 
 * Crispy forms supports the following form field types:
 * 
 *  * HTML input
 *    - text, number, date, password, email, search & textarea
 *  * Material's daterange control
 *  * custom control where the control's component is specified
 *    as an option
 *  * template, where the control's html fragment may be specified
 *    in the client code via ng-template. The NgTemplate is expected
 *    to have the same name as the field.
 *  * group: For nested FormGroups.
 */
@Component({
  selector: 'crispy-mat-form',
  template: `
    <span *ngFor="let f of crispy.fields">
      <app-crispy-field-input
        *ngIf="
          f.type == 'text' ||
          f.type == 'number' ||
          f.type == 'email' ||
          f.type == 'password' ||
          f.type == 'search' ||
          f.type == 'textarea'
        "
        [crispy]="crispy"
        [field]="f"
      ></app-crispy-field-input>
      <app-crispy-field-select
        *ngIf="f.type == 'select'"
        [crispy]="crispy"
        [field]="f"
      ></app-crispy-field-select>
      <app-crispy-field-daterange
        *ngIf="f.type == 'daterange'"
        [crispy]="crispy"
        [field]="f"
      ></app-crispy-field-daterange>
      <app-crispy-field-date
        *ngIf="f.type == 'date'"
        [crispy]="crispy"
        [field]="f"
      ></app-crispy-field-date>
      <app-crispy-field-checkbox
        *ngIf="f.type == 'checkbox'"
        [crispy]="crispy"
        [field]="f"
      ></app-crispy-field-checkbox>
      <span *ngIf="f.type == 'custom'" [formGroup]="crispy.form">
        <app-crispy-field-custom
          [crispy]="crispy"
          [formControlName]="f.formControlName"
          [field]="f"
        ></app-crispy-field-custom>
      </span>
      <span *ngIf="f.type == 'group'">
        <crispy-mat-form
          [crispy]="getChildrenAsCrispyForm(crispy, f.formControlName)"
        ></crispy-mat-form>
      </span>
      <ng-container
        *ngIf="f.type == 'template'"
        [ngTemplateOutlet]="getFieldTemplate(f)"
        [ngTemplateOutletContext]="getFieldTemplateContext(f)"
      >
      </ng-container>
    </span>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrispyMatFormComponent implements OnInit, OnDestroy {
  @ContentChildren(CrispyFieldNameDirective)
  fieldTemplates!: QueryList<CrispyFieldNameDirective>;
  @Input() crispy!: CrispyForm;
  @Input() cffs!: CrispyFormField[];
  @Input() cssClass!: string;

  private _tempForm = new FormGroup({});

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    if (this.cffs && !this.crispy) {
      this.crispy = this.createCrispyFormFromFields(this.cffs, this.cssClass);
    }
  }

  ngOnDestroy(): void {}

  getFieldTemplate(field: CrispyFieldProps): TemplateRef<any> {
    const fnd = CrispyFieldNameDirective._crispyFieldTemplates.find(
      (ft) => ft.crispyFieldName.localeCompare(field.formControlName) == 0
    );
    // const fnd = this.fieldTemplates.find(ft => ft.crispyFieldName.localeCompare(field.formControlName) == 0);
    return fnd!.templateRef;
  }

  /**
   * Returns the context for the 'template' field type's ng-template. Use it as:
   * 
   *  <ng-template let-field='field' let-control='control' let-crispy='crispy'>
   *  </ng-template>
   * 
   * @param field 
   * @returns 
   */
  getFieldTemplateContext(field: CrispyFieldProps): any {
    const control = this.crispy.form.controls[field.formControlName];
    // console.log(`getFieldTemplateContext - control: ${field.formControlName}, value: ${JSON.stringify(control.value)}`);
    return {
      crispy: this.crispy,
      field,
      control
    }
  }

  getFieldControl(field: CrispyFieldProps): AbstractControl<any, any> {
    return this.crispy.form.controls[field.formControlName];
  }

  getChildrenAsCrispyForm(crispy: CrispyForm, fieldName: string): CrispyForm {
    const field: CrispyFieldProps|undefined = crispy.fields.find(
      (cf) => cf.formControlName == fieldName
    );
    const crispyForm = {
      form: crispy.form.controls[fieldName] as FormGroup,
      fields: field?.children || [],
      fieldCssClass: crispy.fieldCssClass,
    };
    return crispyForm;
  }

  get form(): FormGroup<any> {
    return this.crispy ? this.crispy.form : this._tempForm;
  }

  /**
   * Creates CrispyForm object from array of CrispyFormField objects passed
   * as @Input() cffs.
   *
   * @returns CrispyForm
   */
  private createCrispyFormFromFields(
    cffs: CrispyFormField[],
    defaultCssClass?: string
  ): CrispyForm {
    const config = this.injector.get(CRISPY_FORMS_CONFIG_PROVIDER, null);
    const labelFn = config && config.labelFn ? config.labelFn : (code: string) => code;
    if (!defaultCssClass) {
      defaultCssClass = config && config.defaultCssClass ? config.defaultCssClass : '';
    }
    return getCrispyFormHelper(cffs, labelFn, defaultCssClass);
  }
}
