import { useState } from 'react';
import { Button } from './ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Badge } from './ui/badge';
import { ShoppingCart } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

// Default image if none is provided
const DEFAULT_IMAGE = '/images/default-dish.jpg';

// Define spice level as 0-4 instead of string enum to match the database schema
export type SpiceLevel = 0 | 1 | 2 | 3 | 4;

export interface MenuItem {
  item_id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category_id: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  contains_nuts: boolean;
  spice_level: SpiceLevel;
  is_featured: boolean;
  is_active: boolean;
}

export interface CartItem extends Pick<MenuItem, 'item_id' | 'name' | 'price'> {
  quantity: number;
  image_url?: string;
}

interface MenuCardProps extends Omit<MenuItem, 'item_id' | 'category_id' | 'is_active'> {
  item_id: number;
  onAddToCart?: (item: CartItem) => void;
}

const MenuCard = ({ 
  item_id, 
  name, 
  description, 
  price, 
  image_url, 
  is_vegetarian, 
  is_vegan, 
  is_gluten_free, 
  contains_nuts, 
  spice_level, 
  is_featured,
  onAddToCart 
}: MenuCardProps) => {
  const [quantity, setQuantity] = useState<number>(1);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({
        item_id,
        name,
        price,
        quantity,
        image_url
      });
    }
  };

  const renderDietaryBadges = () => {
    const badges = [];
    
    if (is_vegetarian) {
      badges.push(
        <Badge key="vegetarian" variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Vegetarian
        </Badge>
      );
    }
    
    if (is_vegan) {
      badges.push(
        <Badge key="vegan" variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Vegan
        </Badge>
      );
    }
    
    if (is_gluten_free) {
      badges.push(
        <Badge key="gluten-free" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Gluten-Free
        </Badge>
      );
    }
    
    if (contains_nuts) {
      badges.push(
        <Badge key="nuts" variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Contains Nuts
        </Badge>
      );
    }
    
    return badges;
  };
  
  const renderSpiceLevel = () => {
    const spiceLevels: Record<number, { color: string; label: string }> = {
      0: { color: 'bg-gray-300', label: 'No Spice' },
      1: { color: 'bg-green-500', label: 'Mild' },
      2: { color: 'bg-yellow-500', label: 'Medium' },
      3: { color: 'bg-orange-500', label: 'Hot' },
      4: { color: 'bg-red-500', label: 'Extra Hot' }
    };
    
    const spiceInfo = spiceLevels[spice_level] || spiceLevels[0];
    
    return (
      <div className="flex items-center mt-2 space-x-1">
        <span className="text-xs text-gray-500">Spice:</span>
        <span className={`inline-block w-3 h-3 rounded-full ${spiceInfo.color}`}></span>
        <span className="text-xs">{spiceInfo.label}</span>
      </div>
    );
  };

  return (
    <Card className={`overflow-hidden h-full flex flex-col ${is_featured ? 'border-amber-300 shadow-amber-100' : ''}`}>
      <div className="relative">
        <img
          src={image_url || DEFAULT_IMAGE}
          alt={name}
          className="w-full h-48 object-cover"
        />
        {is_featured && (
          <Badge className="absolute top-2 right-2 bg-amber-500">
            Featured
          </Badge>
        )}
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <span className="font-bold text-amber-600">${price.toFixed(2)}</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {renderDietaryBadges()}
        </div>
        
        {renderSpiceLevel()}
      </CardHeader>
      
      <CardContent className="p-4 pt-2 flex-grow">
        <CardDescription className="text-sm line-clamp-3">
          {description}
        </CardDescription>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </button>
          <span className="w-8 text-center">{quantity}</span>
          <button 
            className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleAddToCart} className="gap-1">
                <ShoppingCart className="h-4 w-4" />
                Add
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to your cart</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default MenuCard;
