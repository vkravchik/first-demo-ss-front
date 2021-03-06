import {AfterViewInit, Component, EventEmitter, Inject, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ReplaySubject, Subject} from 'rxjs';
import {MAT_DIALOG_DATA, MatSelect} from '@angular/material';
import {UserService} from '../../services/user.service';
import {TeamService} from '../../services/team.service';
import {take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-maintainers',
  templateUrl: './maintainers.component.html',
  styleUrls: ['./maintainers.component.css']
})
export class MaintainersComponent implements OnInit, AfterViewInit, OnDestroy {

  protected users;
  @Output() maintainersEvent = new EventEmitter<any>();

  /** control for the selected bank for multi-selection */
  public bankMultiCtrl: FormControl = new FormControl();

  /** control for the MatSelect filter keyword multi-selection */
  public bankMultiFilterCtrl: FormControl = new FormControl();

  /** list of users filtered by search keyword */
  public filteredBanksMulti: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  @ViewChild('multiSelect', {static: false}) multiSelect: MatSelect;

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();
  private existsValues: ReplaySubject<any[]>;


  constructor(private userService: UserService,
              private teamService: TeamService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    const user = this.userService.getPgUserFromStorage();
    this.userService.getUsersWithOutCurrent(user.id).subscribe((res: any) => {
      this.users = res.data;
      // set initial selection
      let selectedMaintainers;
      this.teamService.getTeamOfProject(this.data.id).subscribe(re => {

        selectedMaintainers = re.data.filter(f => f.role === 'maintainer');

        selectedMaintainers = selectedMaintainers.map(m => Object.create({id: m.user}));

        this.bankMultiCtrl.setValue(selectedMaintainers);
        this.existsValues = selectedMaintainers;
        this.filteredBanksMulti.next(this.users.slice());
      });

      // load the initial bank list

    });

    // listen for search field value changes
    this.bankMultiFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterBanksMulti();
      });
  }

  ngAfterViewInit() {
    this.setInitialValue();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  /**
   * Sets the initial value after the filteredBanks are loaded initially
   */
  protected setInitialValue() {
    this.filteredBanksMulti
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        // setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection())
        // this needs to be done after the filteredBanks are loaded initially
        // and after the mat-option elements are available
        this.multiSelect.compareWith = (a: any, b: any) => a && b && a.id === b.id;
      });
  }

  protected filterBanksMulti() {
    if (!this.users) {
      return;
    }
    // get the search keyword
    let search = this.bankMultiFilterCtrl.value;
    if (!search) {
      this.filteredBanksMulti.next(this.users.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the users
    this.filteredBanksMulti.next(
      this.users.filter(bank => bank.name.toLowerCase().indexOf(search) > -1)
    );
  }

  nextClick() {
    this.maintainersEvent.emit(this.bankMultiCtrl.value);
  }

}
