import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ShopAgent · 让好选择，自然发生', description: '你的 AI 购物与售后助手' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="zh-CN"><body>{children}</body></html> }
