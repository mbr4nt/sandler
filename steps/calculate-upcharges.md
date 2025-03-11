### **The Goal:**  
We want to set new prices using a "base price + upgrades" model so that:  
1. **Every product has a basic version** at the **lowest price** (e.g., a standard chair with no extras).  
2. **Optional upgrades** (like premium fabric, special wood finishes, or adjustable features) add a fixed cost to the base price.  
3. **No existing price decreases** – we only allow prices to stay the same or increase slightly if needed.

---

### **How It Works:**

#### **Step 1: Find the Base Price**  
The script looks at all current prices for a product (e.g., a chair) and picks the **cheapest configuration** as the base price.  
- Example:  
  - A basic chair with standard fabric, no armrests, and basic wheels costs **USD150** (cheapest price).  
  - This becomes the **base price** for all chairs in that product line.

---

#### **Step 2: Group Prices by Upgradable Features**  
The script organizes prices based on customizable features, like:  
- **Chair categories**: Fabric type, armrests, wheel quality.  
- **Desk categories**: Wood type, surface finish, size.  

For example, a chair might have:  
- **Fabric**: Standard (0), Premium (+USD30), Luxury (+USD60)  
- **Armrests**: None (0), Standard (+USD10), Adjustable (+USD30)  
- **Wheels**: Basic (0), Quiet-Roll (+USD15)  

---

#### **Step 3: Calculate Upcharges for Each Feature**  
For every feature category (e.g., "Fabric"):  
1. **Find the cheapest option** in that category (e.g., "Standard Fabric").  
2. **Set its upcharge to 0** (since it’s included in the base price).  
3. **Calculate upcharges for other options** based on their current price difference.  

- Example for **Chair Fabric**:  
  - Standard Fabric (base): 0 upcharge.  
  - Premium Fabric: Originally costs USD30 more than Standard → **USD30 upcharge**.  
  - Luxury Fabric: Costs USD60 more → **USD60 upcharge**.  

---

#### **Step 4: Ensure Prices Never Go Down**  
The script checks every possible combination of features to ensure the new total price (**base + upcharges**) is **never lower** than the original price.  

- **Example Problem**:  
  - A desk with **Special Walnut Wood** (+USD80) and **Large Size** (+USD20) originally costs **USD400**.  
  - New price calculation: USD300 (base) + USD80 (wood) + USD20 (size) = **USD400** → No change (good!).  

- **Example Fix for a Price Drop**:  
  - A chair with **Premium Fabric** (+USD30) and **Adjustable Armrests** (+USD30) originally costs **USD220**.  
  - New calculation: USD150 (base) + USD30 + USD30 = **USD210** → **USD10 cheaper!**  
  - The script **automatically adds USD10** to the upcharge of *Adjustable Armrests* (now +USD40) to keep the price at **USD220**. This, of course, would cause price increase for all adjustable armrest models. 

---

#### **Step 5: Simplify and Round Prices**  
- All upcharges are rounded to the nearest USD10 (e.g., USD24 becomes USD20, USD27 becomes USD30).  
- Every category (like "Wood Type" for desks) must have **at least one option with no upcharge** so customers can always choose a basic version.  

---

### **Real-World Example:**  
**Product**: Executive Office Chair  
- **Original Configurations**:  
  - Basic: Standard fabric, no armrests, basic wheels → **USD150**  
  - Mid-tier: Premium fabric, standard armrests, quiet-roll wheels → **USD200**  
  - Luxury: Luxury fabric, adjustable armrests, quiet-roll wheels → **USD250**  

**New Pricing Model**:  
- **Base Price**: USD150 (basic configuration).  
- **Upcharges**:  
  - Premium Fabric: +USD30  
  - Luxury Fabric: +USD60  
  - Standard Armrests: +USD10  
  - Adjustable Armrests: +USD30  
  - Quiet-Roll Wheels: +USD15  

**Result**:  
- Mid-tier chair: USD150 + USD30 (fabric) + USD10 (armrests) + USD15 (wheels) = **USD205** (original was USD200 → slight increase to avoid a discount).  
- Luxury chair: USD150 + USD60 + USD30 + USD15 = **USD255** (original was USD250 → small increase).  

