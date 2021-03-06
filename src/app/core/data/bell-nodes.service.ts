import {Injectable} from '@angular/core';
import {LocalizedDataService} from './localized-data.service';
import {TranslateService} from '@ngx-translate/core';
import {Language} from './language';

@Injectable()
export class BellNodesService {

    /**
     * Reference to global garlandtools data.
     */
    private nodes: any[] = (<any>window).gt.bell.nodes;

    constructor(private localizedDataService: LocalizedDataService, private i18n: TranslateService) {
    }

    getNodesByItemName(name: string): any[] {
        const itemIds = this.localizedDataService.getItemIdsByName(name, <Language>this.i18n.currentLang);
        return this.nodes.filter(node => {
            for (const itemId of itemIds) {
                const match = node.items.find(item => item.id === itemId);
                if (match !== undefined) {
                    node.icon = match.icon;
                    node.itemId = itemId;
                    node.slot = +match.slot;
                    node.zoneid = this.localizedDataService.getAreaIdByENName(node.zone);
                    node.areaid = this.localizedDataService.getAreaIdByENName(node.title);
                    return true;
                }
            }
            return false;
        });
    }
}
