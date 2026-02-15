import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter } from 'lucide-react';
import { products } from '@/lib/data';
import type { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <CardHeader className="p-0">
        <div className="relative h-40 w-full">
            <Image src={product.imageUrl} alt={product.name} fill style={{objectFit: 'cover'}} className="rounded-t-lg" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold tracking-tight">{product.name}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
        <div className="flex items-center justify-between mt-4">
            <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
            <Badge variant={product.stock > 0 ? 'secondary' : 'destructive'}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  );
}


export default function ProductsPage() {
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Browse and manage your product inventory.</p>
        </div>
        <div className="flex items-center space-x-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <ListFilter className="mr-2 h-4 w-4" />
                        Filter by Category
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Categories</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {categories.map(category => (
                         <DropdownMenuCheckboxItem key={category}>
                            {category}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
