export interface DealItem {
  id: string;
  name: string;
  price: number;
  retailer: string;
  imageUrl: string;
  isSale: boolean;
}

export const searchInstacartDeals = async (query: string, zipCode: string, retailers: string[]): Promise<DealItem[]> => {
  try {
    const response = await fetch(`/api/deals/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, zipCode, retailers }),
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || "Instacart search failed");
    }
    const data = await response.json();
    
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      retailer: item.retailerName,
      imageUrl: item.image,
      isSale: item.isSale || false
    }));
  } catch (error) {
    console.error("Instacart search error:", error);
    return [];
  }
};
