import {NgModule, Provider} from '@angular/core';
import {ListManagerService} from './list/list-manager.service';
import {HtmlToolsService} from './tools/html-tools.service';
import {HttpClientModule} from '@angular/common/http';
import {GarlandToolsService} from './api/garland-tools.service';
import {I18nToolsService} from './tools/i18n-tools.service';
import {DataService} from './api/data.service';
import {NgSerializerModule} from '@kaiu/ng-serializer';
import {EorzeanTimeService} from './time/eorzean-time.service';
import {I18nPipe} from '../pipes/i18n.pipe';
import {TranslateModule} from '@ngx-translate/core';
import {LocalizedDataService} from './data/localized-data.service';
import {AngularFireModule} from 'angularfire2';
import {AngularFireAuthModule} from 'angularfire2/auth';
import {AngularFireDatabaseModule} from 'angularfire2/database';
import {DataExtractorService, EXTRACTORS} from './list/data/data-extractor.service';
import {CraftedByExtractor} from './list/data/extractor/crafted-by-extractor';
import {TradeSourcesExtractor} from 'app/core/list/data/extractor/trade-sources-extractor';
import {VendorsExtractor} from './list/data/extractor/vendors-extractor';
import {ReducedFromExtractor} from './list/data/extractor/reduced-from-extractor';
import {DesynthsExtractor} from './list/data/extractor/desynths-extractor';
import {GatheredByExtractor} from './list/data/extractor/gathered-by-extractor';
import {GardeningExtractor} from './list/data/extractor/gardening-extractor';
import {VoyagesExtractor} from './list/data/extractor/voyages-extractor';
import {DropsExtractor} from './list/data/extractor/drops-extractor';
import {InstancesExtractor} from './list/data/extractor/instances-extractor';
import {AlarmService} from './time/alarm.service';
import {HelpService} from './component/help.service';
import {BellNodesService} from './data/bell-nodes.service';
import { HelpDialogComponent } from './component/help-dialog/help-dialog.component';
import {MatButtonModule, MatDialogModule} from '@angular/material';
import {LayoutService} from './layout/layout.service';
import {LayoutOrderService} from './layout/layout-order.service';


const dataExtractorProviders: Provider[] = [
    {provide: EXTRACTORS, useClass: CraftedByExtractor, deps: [GarlandToolsService, HtmlToolsService, DataService], multi: true},
    {provide: EXTRACTORS, useClass: GatheredByExtractor, deps: [GarlandToolsService, HtmlToolsService, LocalizedDataService], multi: true},
    {provide: EXTRACTORS, useClass: TradeSourcesExtractor, deps: [DataService], multi: true},
    {provide: EXTRACTORS, useClass: VendorsExtractor, deps: [DataService], multi: true},
    {provide: EXTRACTORS, useClass: ReducedFromExtractor, multi: true},
    {provide: EXTRACTORS, useClass: DesynthsExtractor, multi: true},
    {provide: EXTRACTORS, useClass: InstancesExtractor, multi: true},
    {provide: EXTRACTORS, useClass: GardeningExtractor, multi: true},
    {provide: EXTRACTORS, useClass: VoyagesExtractor, multi: true},
    {provide: EXTRACTORS, useClass: DropsExtractor, multi: true},
];

@NgModule({
    imports: [
        HttpClientModule,
        NgSerializerModule,
        TranslateModule,
        AngularFireModule,
        MatDialogModule,
        MatButtonModule,
    ],
    providers: [
        // Data Extraction
        ...dataExtractorProviders,
        DataExtractorService,
        // Other services
        GarlandToolsService,
        I18nToolsService,
        DataService,
        ListManagerService,
        HtmlToolsService,
        EorzeanTimeService,
        LocalizedDataService,
        AlarmService,
        BellNodesService,
        HelpService,
        LayoutService,
        LayoutOrderService,
    ],
    declarations: [
        I18nPipe,
        HelpDialogComponent,
    ],
    exports: [
        I18nPipe,
        HelpDialogComponent,
        TranslateModule,
        AngularFireModule,
        AngularFireDatabaseModule,
        AngularFireAuthModule
    ]
})
export class CoreModule {
}
