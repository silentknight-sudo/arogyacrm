'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter } from 'lucide-react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateProductDialog } from './create-product-dialog';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';

function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <CardHeader className="p-0">
        <div className="relative h-40 w-full">
            <Image 
              src={product.imageUrl} 
              alt={product.name} 
              fill 
              style={{objectFit: 'cover'}} 
              className="rounded-t-lg"
              unoptimized
            />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold tracking-tight">{product.name}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
        <div className="flex items-center justify-between mt-4">
            <span className="text-xl font-bold">₹{product.price.toFixed(2)}</span>
            <Badge variant={product.stock > 0 ? 'secondary' : 'destructive'}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Badge>
        </div>
      </CardContent>
    </Card>
  );
}


export default function ProductsPage() {
  const firestore = useFirestore();
  const { currentUser, isUserLoading } = useApp();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const productsQuery = useMemoFirebase(() => 
    !isUserLoading && currentUser 
      ? query(collection(firestore, 'products')) 
      : null
  , [firestore, currentUser, isUserLoading]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const categories = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategories(prev => 
      checked ? [...prev, category] : prev.filter(c => c !== category)
    );
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (selectedCategories.length === 0) return products;
    return products.filter(p => selectedCategories.includes(p.category));
  }, [products, selectedCategories]);

  const isLoading = isUserLoading || isLoadingProducts;

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
                         <DropdownMenuCheckboxItem 
                            key={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                         >
                            {category}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
          {currentUser?.role === 'admin' && (
            <CreateProductDialog>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </CreateProductDialog>
          )}
        </div>
      </div>

       {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      )}

      {!isLoading && filteredProducts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
       {!isLoading && filteredProducts?.length === 0 && (
         <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
            <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">No products found</h3>
                <p className="text-sm text-muted-foreground">
                    Create a new product or adjust your filters.
                </p>
            </div>
        </div>
      )}
    </div>
  );
}