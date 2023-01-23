import { Service } from "@tsed/common";
import { generateOperationFunction, URLs } from "../util/ClientHelper";

@Service()
export class PricesService {

  constructor() {}

  async getPrices(query: string): Promise<any[] | any> {

    const promises: any[] = 
      URLs.map(url => generateOperationFunction(query, url));

    return Promise
      .all(promises)
      .then(r => {
        return r.map((r, i) => ({
          [URLs[i].client]: r
        }));
      })
      .catch(e => {
        return { error: 'error' };
      });
  }
}

