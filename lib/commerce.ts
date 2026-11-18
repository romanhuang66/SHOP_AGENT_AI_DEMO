import {products} from './catalog';
import type {Visitor,Order} from './business';
export class CommerceError extends Error {}
// One-time migration: remove all legacy/preseeded orders; paid orders created by
// this flow carry commerceVersion=1 and are never cleared on refresh/redeploy.
export function upgradeCommerce(v:Visitor){
 if(v.commerceVersion!==1){v.orders=[];v.cart=[];v.cartRevision=0;v.commerceVersion=1}
 v.cart??=[];v.cartRevision??=0;
}
export function changeCart(v:Visitor,productId:unknown,quantity:unknown,add=false){
 upgradeCommerce(v);
 if(typeof productId!=='string'||!products.some(p=>p.id===productId))throw new CommerceError('商品不存在');
 if(!Number.isInteger(quantity)||Number(quantity)<(add?1:0)||Number(quantity)>99)throw new CommerceError('商品数量须为1至99的整数');
 const item=v.cart!.find(i=>i.productId===productId);
 const next=add?(item?.quantity||0)+Number(quantity):Number(quantity);
 if(next>99)throw new CommerceError('单款商品最多99件');
 if(!item&&next&&v.cart!.length>=30)throw new CommerceError('购物车商品数量已达上限');
 if(item){if(next)item.quantity=next;else v.cart=v.cart!.filter(i=>i!==item)}else if(next)v.cart!.push({productId,quantity:next});
 v.cartRevision!++;
 return {cart:v.cart,cartRevision:v.cartRevision};
}
export function checkout(v:Visitor,key:unknown,revision:unknown,id:()=>string):{order:Order;duplicate:boolean}{
 upgradeCommerce(v);
 if(typeof key!=='string'||!/^[a-zA-Z0-9-]{8,100}$/.test(key))throw new CommerceError('下单凭据无效，请刷新后重试');
 const previous=v.orders.find(o=>o.checkoutKey===key);
 if(previous)return {order:previous,duplicate:true};
 if(!Number.isInteger(revision)||revision!==v.cartRevision)throw new CommerceError('购物车已更新，请刷新购物车后确认金额再下单');
 if(!v.cart!.length)throw new CommerceError('购物车为空，请先添加商品');
 const items=v.cart!.map(item=>{const p=products.find(p=>p.id===item.productId);if(!p||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>99)throw new CommerceError('购物车商品无效，请重新添加');return {...item,name:p.name,price:p.price}});
 const now=new Date().toISOString();
 const order:Order={id:'SA'+now.slice(0,10).replaceAll('-','')+id().replaceAll('-','').slice(0,12).toUpperCase(),productId:items[0].productId,items,total:items.reduce((sum,i)=>sum+i.price*i.quantity,0),created:now,paidAt:now,payment:'simulated',checkoutKey:key,status:'待发货',deliveredDays:null,eta:'待发货，暂无预计送达时间',events:[]};
 v.orders.unshift(order);v.cart=[];v.cartRevision!++;
 return {order,duplicate:false};
}

// Keep the completed record for checkout idempotency and AI/after-sales queries;
// the consumer's active order list excludes received orders.
export function confirmReceipt(v:Visitor,orderId:unknown){
 if(typeof orderId!=='string'||!orderId.trim()||orderId.length>40)throw new CommerceError('订单号无效');
 const order=v.orders.find(o=>o.id===orderId.trim().toUpperCase());
 if(!order)throw new CommerceError('无法确认该订单，请刷新后重试');
 if(!order.receivedAt){
  if(order.payment!=='simulated'||order.status==='已取消')throw new CommerceError('该订单不能确认收货');
  const now=new Date().toISOString();
  order.receivedAt=now;order.status='已签收';order.deliveredDays=0;order.eta='已送达（模拟确认收货）';
  order.events.push({time:now,text:'用户确认收货（模拟）'});
 }
 return {ok:true,orders:v.orders.filter(o=>!o.receivedAt)};
}
