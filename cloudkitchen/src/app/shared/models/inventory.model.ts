// Inventory model matching MongoDB UserInventory schema
export interface Inventory {
  _id?: string;
  inventoryId: string;
  userId: string;
  ingredientName: string;
  quantity: number;
  unit: 'pieces' | 'kg' | 'g' | 'liters' | 'ml' | 'cups' | 'tbsp' | 'tsp' | 'dozen';
  category: 'Vegetables' | 'Fruits' | 'Meat' | 'Dairy' | 'Grains' | 'Spices' | 'Beverages' | 'Frozen' | 'Canned' | 'Other';
  purchaseDate: Date;
  expirationDate: Date;
  location: 'Fridge' | 'Freezer' | 'Pantry' | 'Counter' | 'Cupboard';
  cost: number;
  createdDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryRequest {
  ingredientName: string;
  quantity: number;
  unit: string;
  category: string;
  purchaseDate: string;
  expirationDate: string;
  location: string;
  cost: number;
}
