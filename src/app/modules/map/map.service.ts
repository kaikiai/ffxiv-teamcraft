import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {MapData} from './map-data';
import {Aetheryte} from '../../core/data/aetheryte';
import {aetherytes} from '../../core/data/sources/aetherytes';

@Injectable()
export class MapService {

    data: Observable<MapData[]>;

    constructor(private http: HttpClient) {
        this.data = this.http.get<any>('https://api.xivdb.com/maps/get/layers/id')
            .map(res => {
                return Object.keys(res.data).map(key => res.data[key]).map(row => row[0]) as MapData[];
            })
            .map(mapData => {
                return mapData.map(row => {
                    row.aetherytes = this.getAetherytes(row.placename_id);
                    return row;
                });
            })
            .publishReplay(1)
            .refCount();
    }

    getMapById(id: number): Observable<MapData> {
        return this.data.map(data => {
            return data.find(row => row.placename_id === id);
        });
    }

    private getAetherytes(id: number): Aetheryte[] {
        return aetherytes.filter(aetheryte => aetheryte.placenameid === id);
    }

    getPositionOnMap(map: MapData, position: { x: number, y: number }): { x: number, y: number } {
        const scale = map.size_factor / 100;

        const offset = 1;

        // 20.48 is 2048 / 100, so we get percents in the end.
        const x = (position.x - offset) * 50 * scale / 20.48;
        const y = (position.y - offset) * 50 * scale / 20.48;

        return {
            x: x,
            y: y
        };
    }
}
