import {Component, ElementRef, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {ListManagerService} from '../../../core/list/list-manager.service';
import {List} from '../../../model/list/list';
import {MatCheckboxChange, MatDialog, MatSnackBar} from '@angular/material';
import {ListNamePopupComponent} from '../../../modules/common-components/list-name-popup/list-name-popup.component';
import {DataService} from '../../../core/api/data.service';
import {Recipe} from '../../../model/list/recipe';
import {I18nToolsService} from '../../../core/tools/i18n-tools.service';
import {GarlandToolsService} from '../../../core/api/garland-tools.service';
import {TranslateService} from '@ngx-translate/core';
import {Router} from '@angular/router';
import {HtmlToolsService} from '../../../core/tools/html-tools.service';
import {ListService} from '../../../core/database/list.service';
import {SearchFilter} from '../../../model/search/search-filter.interface';
import {BulkAdditionPopupComponent} from '../bulk-addition-popup/bulk-addition-popup.component';
import {LocalizedDataService} from '../../../core/data/localized-data.service';
import {UserService} from '../../../core/database/user.service';
import {PageComponent} from '../../../core/component/page-component';
import {ComponentType} from '@angular/cdk/portal';
import {RecipesHelpComponent} from '../recipes-help/recipes-help.component';
import {HelpService} from '../../../core/component/help.service';

declare const ga: Function;

@Component({
    selector: 'app-recipes',
    templateUrl: './recipes.component.html',
    styleUrls: ['./recipes.component.scss']
})
export class RecipesComponent extends PageComponent implements OnInit {

    recipes: Recipe[] = [];

    @ViewChild('filter')
    filterElement: ElementRef;

    filters: SearchFilter[] = [
        {
            enabled: false,
            minMax: true,
            select: false,
            multiple: false,
            value: {
                min: 0,
                max: 999
            },
            name: 'filters/ilvl',
            filterName: 'ilvl'
        },
        {
            enabled: false,
            minMax: true,
            select: false,
            multiple: false,
            value: {
                min: 0,
                max: 70
            },
            name: 'filters/lvl',
            filterName: 'elvl'
        },
        {
            enabled: false,
            minMax: true,
            select: false,
            multiple: false,
            value: {
                min: 0,
                max: 70
            },
            name: 'filters/craft_lvl',
            filterName: 'clvl'
        },
        {
            enabled: false,
            minMax: false,
            select: false,
            multiple: true,
            value: [],
            values: this.gt.getJobs().filter(job => job.isJob !== undefined || job.category === 'Disciple of the Land'),
            name: 'filters/worn_by',
            filterName: 'jobCategories'
        },
        {
            enabled: false,
            minMax: false,
            select: true,
            multiple: false,
            value: 0,
            values: this.gt.getJobs().filter(job => job.category.indexOf('Hand') > -1),
            name: 'filters/crafted_by',
            filterName: 'craftJob'
        },
    ];

    query: string;

    lists: List[];

    loading = false;

    constructor(private resolver: ListManagerService, private db: DataService,
                private snackBar: MatSnackBar, protected dialog: MatDialog,
                private i18n: I18nToolsService, private gt: GarlandToolsService,
                private translator: TranslateService, private router: Router,
                private htmlTools: HtmlToolsService, private listService: ListService,
                private localizedData: LocalizedDataService, private userService: UserService,
                protected helpService: HelpService) {
        super(dialog, helpService);
    }

    ngOnInit() {
        super.ngOnInit();
        // Load user's lists
        this.subscriptions.push(this.userService.getUserData().switchMap((user) => {
            if (user.$key !== undefined) {
                return this.listService.getUserLists(user.$key);
            }
            return Observable.of([]);
        }).subscribe(lists => this.lists = lists));

        // Connect debounce listener on recipe search field
        this.subscriptions.push(Observable.fromEvent(this.filterElement.nativeElement, 'keyup')
            .debounceTime(500)
            .distinctUntilChanged()
            .subscribe(() => {
                this.doSearch();
            }));

    }

    /**
     * Adds a jobCategory to current filters.
     * @param {number} id
     * @param {MatCheckboxChange} event
     */
    checkJobCategory(id: number, event: MatCheckboxChange): void {
        const jobCategories = this.filters.find(filter => filter.filterName === 'jobCategories');
        if (event.checked) {
            jobCategories.value.push(id);
        } else {
            jobCategories.value = jobCategories.value.filter(jobId => jobId !== id);
        }
    }

    /**
     * Fires a search request, including filters.
     */
    doSearch(): void {
        this.loading = true;
        let hasFilters = false;
        this.filters.forEach(f => hasFilters = hasFilters || f.enabled);
        if ((this.query === undefined || this.query === '') && !hasFilters) {
            this.recipes = [];
            this.loading = false;
            return;
        }
        this.subscriptions.push(this.db.searchRecipe(this.query, this.filters).subscribe(results => {
            this.recipes = results;
            this.loading = false;
        }));
    }

    /**
     * Gets job informations from a given job id.
     * @param {number} id
     * @returns {any}
     */
    getJob(id: number): any {
        return this.gt.getJob(id);
    }

    /**
     * Generates star html string for recipes with stars.
     * @param {number} nb
     * @returns {string}
     */
    getStars(nb: number): string {
        return this.htmlTools.generateStars(nb);
    }


    /**
     * Adds a recipe to a given list
     *
     * @param {Recipe} recipe The recipe we want to add
     * @param {List} list The list we want to add the recipe to
     * @param {string} key The database key of the list
     * @param {string} amount The amount of items we want to add, this is handled as a string because a string is expected from the template
     */
    addRecipe(recipe: Recipe, list: List, key: string, amount: string): void {
        this.subscriptions.push(this.resolver.addToList(recipe.itemId, list, recipe.recipeId, +amount)
            .subscribe(updatedList => {
                this.listService.update(key, updatedList).first().subscribe(() => {
                    this.snackBar.open(
                        this.translator.instant('Recipe_Added',
                            {itemname: this.i18n.getName(this.localizedData.getItem(recipe.itemId)), listname: list.name}),
                        this.translator.instant('Open'),
                        {
                            duration: 10000,
                            extraClasses: ['snack']
                        }
                    ).onAction().subscribe(() => {
                        this.listService.getRouterPath(key).subscribe(path => {
                            this.router.navigate(path);
                        });
                    });
                });
            }, err => console.error(err)));
    }

    quickList(recipe: Recipe, amount: string): void {
        const list = new List();
        ga('send', 'event', 'List', 'creation');
        list.name = this.i18n.getName(this.localizedData.getItem(recipe.itemId));
        list.ephemeral = true;
        this.resolver.addToList(recipe.itemId, list, recipe.recipeId, +amount)
            .switchMap((l) => {
                return this.userService.getUserData().map(u => {
                    l.authorId = u.$key;
                    return l;
                });
            })
            .switchMap(quickList => {
                return this.listService.add(quickList).map(uid => {
                    list.$key = uid;
                    return list;
                });
            })
            .subscribe((l) => {
                this.listService.getRouterPath(l.$key).subscribe(path => {
                    this.router.navigate(path);
                });
            });
    }

    /**
     * Adds the current resultSet to a given list.
     * @param {List} list
     * @param {string} key
     */
    addAllRecipes(list: List, key: string): void {
        const additions = [];
        this.recipes.forEach(recipe => {
            additions.push(this.resolver.addToList(recipe.itemId, list, recipe.recipeId, 1));
        });
        this.subscriptions.push(this.dialog.open(BulkAdditionPopupComponent, {
            data: {additions: additions, key: key, listname: list.name},
            disableClose: true
        }).afterClosed().subscribe(() => {
            this.snackBar.open(
                this.translator.instant('Recipes_Added', {listname: list.name}),
                this.translator.instant('Open'),
                {
                    duration: 10000,
                    extraClasses: ['snack']
                }
            ).onAction().subscribe(() => {
                this.listService.getRouterPath(key).subscribe(path => {
                    this.router.navigate(path);
                });
            });
        }));
    }

    /**
     * Adds the current result set to a new list.
     */
    addAllToNewList(): void {
        this.createNewList().then(res => {
            this.addAllRecipes(res.list, res.id);
        });
    }

    /**
     * Adds a given recipe to a new list.
     * @param recipe
     * @param {string} amount
     */
    addToNewList(recipe: any, amount: string): void {
        this.createNewList().then(res => {
            this.addRecipe(recipe, res.list, res.id, amount);
        });
    }

    /**
     * Creates a new list using the dialog to ask for a name.
     * @returns {Promise<string>}
     */
    createNewList(): Promise<{ id: string, list: List }> {
        return new Promise<{ id: string, list: List }>(resolve => {
            this.subscriptions.push(this.dialog.open(ListNamePopupComponent).afterClosed()
                .switchMap(res => {
                    return this.userService.getUserData().map(u => {
                        return {authorId: u.$key, listName: res};
                    })
                })
                .subscribe(res => {
                    const list = new List();
                    ga('send', 'event', 'List', 'creation');
                    list.name = res.listName;
                    list.authorId = res.authorId;
                    this.listService.add(list).first().subscribe(id => {
                        resolve({id: id, list: list});
                    });
                }));
        });
    }


    getHelpDialog(): ComponentType<any> | TemplateRef<any> {
        return RecipesHelpComponent;
    }

}
