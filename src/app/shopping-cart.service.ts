import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Product } from './models/product';
import { take } from 'rxjs/operators';
import { ShoppingCart } from './models/shopping-cart';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {

  constructor(private db: AngularFireDatabase) { }

  async getCart(): Promise<Observable<ShoppingCart>> {
    const cartId = await this.getOrCreateCartId();
    return this.db.object('/shopping-carts/' + cartId).valueChanges()
      .pipe(map((x: any) => new ShoppingCart(x.items)));
  }

  async addToCart(product: Product) {
    this.updateItem(product, 1);
  }


  async removeFromCart(product: Product) {
    this.updateItem(product, -1);
  }

  async clearCart() {
    let cartId = await this.getOrCreateCartId();
    this.db.object('/shopping-carts/' + cartId + '/items').remove();
  }

  private create() {
    return this.db.list('/shopping-carts').push({
      dateCreated: new Date().getTime()
    });
  }

  private getItem(cartId: string, productId: string) {
    return this.db.object('/shopping-carts/' + cartId + '/items/' + productId);
  }

  private async getOrCreateCartId() {
    let cartId = localStorage.getItem('cartId');
    if (cartId) return cartId;

    let result = await this.create();
    localStorage.setItem('cartId', result.key);
    return result.key;
  }

  private async updateItem(product: Product, change: number) {
    let cartId = await this.getOrCreateCartId();
    let item$ = this.getItem(cartId, product.id);
    item$.valueChanges().pipe(take(1)).subscribe((item: any) => {
      if (item != null) {
        let quantity = item.quantity + change;
        if (quantity === 0) {
          item$.remove();
        } else {
          item$.update({
            title: product.title,
            imageUrl: product.imageUrl,
            price: product.price,
            quantity: quantity
          });
        }
      } else {
        item$.set({
          title: product.title,
          imageUrl: product.imageUrl,
          price: product.price,
          quantity: 1
        });
      }
    });
  }

}
