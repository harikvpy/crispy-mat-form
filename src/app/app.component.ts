import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  CrispyBuilder,
  CrispyCheckbox,
  CrispyCustomComponent,
  CrispyDate,
  CrispyDateRange,
  CrispyDiv,
  CrispyField,
  CrispyFormGroup,
  CrispyFormGroupArray,
  CrispyMatFormComponent,
  CrispyNumber,
  CrispyPassword,
  CrispyRow,
  CrispySelect,
  CrispyTemplate,
  CrispyText
} from '@smallpearl/crispy-mat-form';
import { BehaviorSubject, of, tap } from 'rxjs';
import { MyTelInput } from './components/my-tel-input/my-tel-input.component';

@Component({
  selector: 'app-root',
  template: `
    <h1>Crispy Form Demo</h1>
    <form [formGroup]="crispy.form" (ngSubmit)="onSubmit()" errorTailor>
      <crispy-mat-form
        [crispy]="crispy"
        (formGroupAdded)="onFormGroupAdded($event)"
        (formGroupRemoved)="onFormGroupRemoved($event)"
      ></crispy-mat-form>
      <div>
        <button
          mat-raised-button
          color="primary"
          type="button"
          (click)="onReset()"
        >
          Reset</button
        >&nbsp;
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="crispy.form.invalid"
        >
          Submit
        </button>
      </div>
    </form>

    <ng-template crispyFieldName="mobile" let-formGroup="formGroup">
      <span *ngIf="formGroup" [formGroup]="formGroup">
        <mat-form-field class="w-100">
          <mat-label>My Telephone</mat-label>
          <my-tel-input formControlName="mobile"></my-tel-input>
        </mat-form-field>
      </span>
    </ng-template>

    <ng-template
      crispyFieldName="dummy"
      let-control="control"
      let-field="field"
      let-crispy="crispy"
      let-formGroup="formGroup"
    >
      Members: <span *ngFor="let m of control.value">{{ m }}&nbsp;</span>
    </ng-template>

    <ng-template
      crispyFieldName="lineTotal"
      let-formGroup="formGroup"
      let-control="control"
    >
      <div style="text-align: right;">
        <h3>{{ asCurrency(control.value) }}</h3>
      </div>
    </ng-template>

    <ng-template
      crispyFieldName="total"
      let-control="control"
      let-field="field"
      let-crispy="crispy"
      let-formGroup="formGroup"
    >
      <div
        style="width: 100% !important; display: flex; justify-content: end; padding: 0.4em 1em;"
      >
        <h2 *ngIf="total | async as invoiceTotal">
          Total: {{ asCurrency(invoiceTotal) }}
        </h2>
      </div>
    </ng-template>

    <!-- <router-outlet></router-outlet> -->
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
  crispy = this.getCrispy();
  @ViewChild(CrispyMatFormComponent, { static: true })
  crispyComponent!: CrispyMatFormComponent;
  total = new BehaviorSubject<number>(0);

  constructor(private crispyBuilder: CrispyBuilder) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const items: FormArray = this.crispy.form?.controls['items'] as FormArray;
    if (items) {
      items.valueChanges
        .pipe(
          tap(
            (
              values: {
                name: string;
                qty: number;
                unitPrice: number;
                total: number;
              }[]
            ) => {
              let invoiceTotal = 0;
              values.forEach((value, index: number) => {
                const lineTotal = Number(value.qty) * Number(value.unitPrice);
                invoiceTotal += lineTotal;
                const totalControl = (items.at(index) as FormGroup).controls[
                  'total'
                ];
                (items.at(index) as FormGroup).controls['lineTotal']?.setValue(
                  lineTotal,
                  { emitEvent: false }
                );
              });
              this.crispy.form.controls['total'].setValue(invoiceTotal);
              this.total.next(invoiceTotal);
              // console.log(`invoice total: ${invoiceTotal}`);
            }
          )
        )
        .subscribe();
    }
  }

  getCrispy() {
    /**
     * Check if the end date in date range is within this month. If not
     * set error state in the control. Otherwise, clear the error.
     * @param control
     * @returns
     */
    const endDateRangeValidator = (control: AbstractControl<any, any>) => {
      const endDate = new Date();
      endDate.setTime(Date.parse(control.value));
      const endDateMonth = endDate.getMonth();
      if (!Number.isInteger(endDateMonth) || endDateMonth > new Date().getMonth()) {
        return { invalidDate: true };
      }
      return null;
    };
    const matchPasswords = (fg: FormGroup<any>): ValidationErrors | null => {
      let password = undefined;
      let confirmPassword = undefined;
      for (const key in fg.controls) {
        if (key == 'password') {
          password = fg.controls[key].value as string;
        } else {
          confirmPassword = fg.controls[key].value as string;
        }
      }

      if (
        (password && confirmPassword && password === confirmPassword) ||
        !confirmPassword
      ) {
        return null;
      }
      fg.controls['confirmPassword'].setErrors({ passwordMismatch: true });
      return null;
    };
    const fields: CrispyField[] = [
      CrispyRow([
        CrispyText('firstName', 'Peter', {
          label: 'First name',
          validators: Validators.required,
        }),
        CrispyText('lastName', 'Parker', {
          validators: Validators.required,
          label: 'Last name',
        }),
      ]),
      CrispyDate('date', new Date()),
      CrispyDateRange(
        'publishedOn',
        {
          beginRangeLabel: 'From',
          endRangeLabel: 'To',
          beginRangeFormControlName: 'published_on__gte',
          endRangeFormControlName: 'published_on__lte',
          endRangeValidators: endDateRangeValidator,
        },
        {
          published_on__gte: '2023-06-19T16:00:00.000Z',
          published_on__lte: '2023-06-25T16:00:00.000Z',
        },
        {
          validators: Validators.required
        }
      ),
      CrispyFormGroup(
        'matchingPassword',
        CrispyRow([
          CrispyPassword('password', '', {
            // validators: Validators.required,
          }),
          CrispyPassword('confirmPassword', '', {
            // validators: Validators.required,
          }),
        ]),
        (fg) => matchPasswords(fg as FormGroup)
      ),
      CrispySelect(
        'sex',
        [
          { label: 'Male', value: 'M' },
          { label: 'Female', value: 'F' },
          { label: 'Transgender', value: 'T' },
        ],
        { initial: 'M', validators: Validators.required }
      ),
      CrispySelect(
        'status',
        of([
          { label: 'Married', value: 'M' },
          { label: 'Single', value: 'S' },
          { label: 'Widow/Widower', value: 'W' },
        ]),
        { initial: 'M', validators: Validators.required }
      ),
      CrispyRow([
        CrispyCustomComponent(
          'telephone',
          { area: '618', exchange: '782', subscriber: '2890' },
          { component: MyTelInput }
        ),
        CrispyTemplate('mobile', {
          area: '737',
          exchange: '777',
          subscriber: '0787',
        }),
      ]),
      CrispyNumber('age'),
      CrispyCheckbox('public', false),
      CrispyTemplate('dummy', [1, 2, 3]),
      CrispyFormGroupArray(
        'items',
        [
          CrispyRow([
            CrispyText('name', '', {
              validators: Validators.required,
              label: 'Name',
            }),
            CrispyNumber('qty', 0, {
              validators: Validators.required,
              label: 'Quantity',
            }),
            CrispyNumber('unitPrice', 0, {
              validators: Validators.required,
              label: 'Unit Price',
            }),
            CrispyTemplate('lineTotal', 0),
          ]),
        ],
        [
          { name: 'Management Fee', qty: 30, unitPrice: 100, lineTotal: 3000 },
          { name: 'Carpark Fee', qty: 1, unitPrice: 900, lineTotal: 900 },
        ],
        {
          // setting these to true will remove the respective buttons
          // disableAddRow: true,
          // disableDelRow: true
          showFieldColumnTitle: true
        },
        { label: 'Line Items' }
      ),
      CrispyTemplate('total', 0, {
        context: { customers: [] },
      }),
    ];
    return this.crispyBuilder.build(fields);
  }

  onFormGroupAdded(event: any) {
    const fgEvent: { field: string; form: FormGroup } = event as {
      field: string;
      form: FormGroup;
    };
    console.log(
      `form group added - field: ${fgEvent.field}, group valid?: ${fgEvent.form.valid}`
    );
  }

  onFormGroupRemoved(event: any) {
    const fgEvent: { field: string; form: FormGroup } = event as {
      field: string;
      form: FormGroup;
    };
    console.log(
      `form group removed - field: ${fgEvent.field}, group: ${fgEvent.form}`
    );
  }

  onReset() {
    this.crispy.form?.reset();
  }

  onSubmit() {
    console.log(
      `onSubmit - form.value: ${JSON.stringify(this.crispy.form?.value)}`
    );
  }

  asCurrency(value: number) {
    return (Math.round(value * 100) / 100).toFixed(2);
  }
}
