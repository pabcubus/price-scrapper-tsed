import {Controller, Get, QueryParams} from '@tsed/common';
import { PricesService } from '../../services/PricesService';

@Controller('/prices')
export class PricesCtrl {
  constructor(private pricesService: PricesService) { }

  @Get('/')
  async getAll(@QueryParams('query') query: string) {
    return this.pricesService.getPrices(query);
  }
}
