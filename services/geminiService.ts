

// Category detection for intelligent routing
type QueryCategory = 
  | 'greeting'
  | 'price'
  | 'delivery'
  | 'quality'
  | 'recommendation'
  | 'comparison'
  | 'calculation'
  | 'payment'
  | 'timing'
  | 'project_specific'
  | 'location'
  | 'contact'
  | 'brick_list'
  | 'booking'
  | 'unknown';

interface CategoryKeywords {
  category: QueryCategory;
  keywords: string[];
  nepaliKeywords: string[];
  priority: number;
}

const CATEGORY_PATTERNS: CategoryKeywords[] = [
  {
    category: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'good afternoon'],
    nepaliKeywords: ['namaste', 'namaskar', 'kasto cha', 'k cha', 'kai ho', 'ramro cha'],
    priority: 1
  },
  {
    category: 'price',
    keywords: ['price', 'cost', 'rate', 'how much', 'expensive', 'cheap', 'affordable', 'dear'],
    nepaliKeywords: ['price', 'paisa', 'rate', 'kati', 'dam', 'sasto', 'mahango', 'kati parcha'],
    priority: 5
  },
  {
    category: 'delivery',
    keywords: ['delivery', 'shipping', 'transport', 'charge', 'free delivery', 'ship', 'transportation'],
    nepaliKeywords: ['delivery', 'charge', 'kharcha', 'pauchha', 'pathayo', 'kati lagcha', 'lagcha', 'purayo'],
    priority: 6
  },
  {
    category: 'quality',
    keywords: ['quality', 'standard', 'strength', 'durability', 'certified', 'grade', 'strong', 'weak'],
    nepaliKeywords: ['quality', 'guna', 'strength', 'tikau', 'ramro', 'kharab', 'chalcha', 'chalne'],
    priority: 3
  },
  {
    category: 'recommendation',
    keywords: ['recommend', 'suggest', 'best', 'should i', 'which one', 'what to buy', 'what type', 'advice', 'ramro', 'lida ramro'],
    nepaliKeywords: ['kun', 'ramro', 'recommend', 'sifaris', 'kunu kinnu', 'kinnu', 'k kinnu', 'advice', 'lida ramro'],
    priority: 7
  },
  {
    category: 'brick_list',
    keywords: ['types', 'available', 'what do you have', 'offer', 'provide', 'sell', 'kun kun brick'],
    nepaliKeywords: ['kun kun', 'kati kati', 'k kati', 'cha', 'huncha', 'available', 'parcha', 'kun kun brick'],
    priority: 8
  },
  {
    category: 'comparison',
    keywords: ['compare', 'difference', 'vs', 'versus', 'better than', 'verses', 'which better'],
    nepaliKeywords: ['compare', 'farak', 'kun ramro', 'difference', 'ma', 'kun asal', 'fark'],
    priority: 4
  },
  {
    category: 'calculation',
    keywords: ['calculate', 'trip', 'how many', 'total', 'estimate', 'calculation', 'bricks needed'],
    nepaliKeywords: ['calculate', 'ganana', 'kati trip', 'total', 'kati wata', 'huncha', 'kati', 'jana'],
    priority: 5
  },
  {
    category: 'payment',
    keywords: ['payment', 'pay', 'cash', 'online', 'bank', 'esewa', 'cod', 'advance', 'deposit'],
    nepaliKeywords: ['payment', 'paisā', 'cash', 'online', 'tirne', 'advance', 'deposit', 'kasaile', 'paise'],
    priority: 4
  },
  {
    category: 'timing',
    keywords: ['when', 'time', 'how long', 'delivery time', 'available', 'schedule', 'urgent', 'now'],
    nepaliKeywords: ['kaile', 'samaya', 'kati din', 'time', 'chito', 'urgent', 'aile', 'pachi'],
    priority: 3
  },
  {
    category: 'location',
    keywords: ['bhaktapur', 'kathmandu', 'lalitpur', 'where', 'location', 'area', 'available in', 'service area'],
    nepaliKeywords: ['bhaktapur', 'kathmandu', 'lalitpur', 'kaha', 'thau', 'area', 'ma', 'service', 'kun area'],
    priority: 4
  },
  {
    category: 'contact',
    keywords: ['call', 'contact', 'number', 'phone', 'whatsapp', 'email', 'address', 'meet', 'garnu'],
    nepaliKeywords: ['call', 'contact', 'number', 'phone', 'whatsapp', 'email', 'address', 'bhet', 'garnu'],
    priority: 6
  },
  {
    category: 'booking',
    keywords: ['book', 'order', 'buy', 'purchase', 'reserve', 'booking', 'order garnu', 'book garnu'],
    nepaliKeywords: ['book', 'order', 'kinnu', 'booking', 'order garnu', 'book garnu', 'reserve'],
    priority: 7
  },
  {
    category: 'project_specific',
    keywords: ['house', 'home', 'building', 'construction', 'foundation', 'wall', 'pillar', 'floor'],
    nepaliKeywords: ['ghar', 'bhavan', 'foundation', 'wall', 'boundary', 'bhitta', 'pillar', 'tala'],
    priority: 4
  }
];

function detectCategory(prompt: string): QueryCategory {
  const lowerPrompt = prompt.toLowerCase();
  let detectedCategory: QueryCategory = 'unknown';
  let highestPriority = -1;
  
  // Special handling for specific questions
  if (lowerPrompt.includes('kun kun') || 
      lowerPrompt.includes('kati kati') || 
      lowerPrompt.includes('k kati') ||
      lowerPrompt.includes('what bricks') ||
      lowerPrompt.includes('available bricks') ||
      lowerPrompt.includes('bricks do you have') ||
      (lowerPrompt.includes('brick') && lowerPrompt.includes('cha'))) {
    return 'brick_list';
  }
  
  if (lowerPrompt.includes('delivery charge') || 
      lowerPrompt.includes('delivery kati') ||
      lowerPrompt.includes('kharcha')) {
    return 'delivery';
  }
  
  if (lowerPrompt.includes('book garnu') ||
      lowerPrompt.includes('order garnu') ||
      lowerPrompt.includes('booking info')) {
    return 'booking';
  }
  
  if (lowerPrompt.includes('call garnu') ||
      lowerPrompt.includes('phone garnu') ||
      lowerPrompt.includes('contact garnu')) {
    return 'contact';
  }
  
  for (const pattern of CATEGORY_PATTERNS) {
    const allKeywords = [...pattern.keywords, ...pattern.nepaliKeywords];
    let matchCount = 0;
    
    for (const keyword of allKeywords) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      const categoryPriority = pattern.priority + (matchCount * 0.1);
      if (categoryPriority > highestPriority) {
        highestPriority = categoryPriority;
        detectedCategory = pattern.category;
      }
    }
  }
  
  return detectedCategory;
}

// Intelligent response generator
export const getSmartAssistance = async (prompt: string): Promise<string> => {
  const category = detectCategory(prompt);
  
  console.log(`Detected category: ${category} for prompt: ${prompt}`);
  
  try {
    switch (category) {
      case 'greeting':
        return generateGreeting();
      
      case 'price':
        return generatePriceInfo();
      
      case 'delivery':
        return generateDeliveryInfo();
      
      case 'quality':
        return generateQualityInfo();
      
      case 'recommendation':
        return generateRecommendation();
      
      case 'brick_list':
        return generateBrickList();
      
      case 'comparison':
        return generateComparison();
      
      case 'calculation':
        return generateCalculation(10000);
      
      case 'payment':
        return generatePaymentInfo();
      
      case 'timing':
        return generateTimingInfo();
      
      case 'location':
        return generateLocationInfo();
      
      case 'contact':
        return generateContactInfo();
      
      case 'booking':
        return generateBookingInfo();
      
      case 'project_specific':
        return generateProjectAdvice();
      
      case 'unknown':
      default:
        return generateFlexibleResponse(prompt);
    }
  } catch (error) {
    console.error('Error generating response:', error);
    return generateFallbackResponse(prompt);
  }
};

// Response generators
function generateGreeting(): string {
  return `🙏 **Namaste! eBricks ma swagat cha!** 

Ma hajur ko brick-related sabai questions ko answer dinchu:

**Quick Help Menu:**
💰 **Price:** "101, C.M., NTB ko price?"
🚚 **Delivery:** "Kati charge? Kati din ma?"
💎 **Quality:** "Kun brick ramro? Strength kati?"
🧮 **Calculation:** "10,000 bricks ko kati?"
📋 **List:** "Kun kun brick cha?"

📞 **Direct:** 9851210449 (Sachin)
⏰ 7 AM - 7 PM, Mon-Sat

**Tapai ko sawal k ho?** 😊`;
}

function generatePriceInfo(): string {
  return `💰 **eBricks - Price List** 

**HAMI SANGA 3 PRAKAR KO BRICKS:**

**⭐ BEST VALUE ⭐**
**C.M. Bricks:** Rs **14**/unit
• Ghar ko lagi perfect
• Smooth finish
• 100+ kg/cm² strength

**💪 PREMIUM STRENGTH**
**101 Bricks:** Rs **15**/unit
• Foundation & pillars ko lagi
• 120+ kg/cm² strength
• High-rise ready

**📍 BHAKTAPUR ONLY**
**NTB Local:** Rs **14.5**/unit
• Advance payment required
• Bhaktapur ma matra

---
**💰 Example Cost:**
• 5000 C.M. bricks = Rs 70,000
• 5000 101 bricks = Rs 75,000
• **C.M. le Rs 5,000 bachhaunuhuncha!**

📞 **Quote ko lagi:** 9851210449`;
}

function generateDeliveryInfo(): string {
  return `🚚 **Delivery Information**

**Free Delivery ( Inside Ring Road):**

• Ring Road bhitra after 7 pm
• Minimum: 2000 bricks (1 trip)

**Outside Ring Road:**
• Delivery charge applies
• Based on distance
• Call for exact price

**Daytime Delivery (9AM - 6PM)**

📞 **Delivery quote & schedule:** 9851210449`;
}

function generateBrickList(): string {
  return `🏗️ **eBricks - Hamro Available Bricks Haru** 

**HAMI SANGA YESTA 3 PRAKAR KO BRICKS HARU CHAN:**

**1. 101 BRICKS** 💪 **PREMIUM STRENGTH**
   **Price:** Rs **15** per brick
   **Strength:** 120+ kg/cm²
   **Features:**
   ✓ Extra strong for foundation & pillars
   ✓ High-rise construction ready
   ✓ Maximum durability
   **Ramro huncha:** Foundation, pillars, load-bearing walls, high-rise buildings

**2. C.M. BRICKS** ⭐ **BEST VALUE**
   **Price:** Rs **14** per brick
   **Strength:** 100+ kg/cm²
   **Features:**
   ✓ Smooth finish (plastering sajilo)
   ✓ Uniform size & color
   ✓ Cost-effective quality
   **Ramro huncha:** Ghar, boundary walls, general construction, 2-3 storey buildings

**3. NTB LOCAL BRICKS** 📍 **BHAKTAPUR ONLY**
   **Price:** Rs **14.5** per brick
   **Strength:** 90+ kg/cm²
   **Features:**
   ✓ Bhaktapur ma locally produced
   ✓ General construction ko lagi ramro
   ✓ Competitive pricing
   **⚠️ Special Conditions:**
   • Advance payment required
   • Payment first, then brick supply
   • Available ONLY in Bhaktapur Municipality

---
**📊 QUICK COMPARISON:**
• **101 Bricks:** Rs 15 - Maximum strength (Foundation/Pillars)
• **C.M. Bricks:** Rs 14 - Best overall value ⭐ (Ghar/Boundary)
• **NTB Local:** Rs 14.5 - Bhaktapur local (Advance payment)

**📞 Sabai details ko lagi call garnus: 9851210449**
**⏰ 7 AM - 7 PM, Mon-Sat**`;
}

function generateRecommendation(): string {
  return `⭐ **Recommendation**

**Sabai bhanda ramro: C.M. Bricks** (Rs 14/unit) ⭐

**Kina C.M. popular cha:**
1. **Price & Quality balance** ramro
2. **Smooth finish** = plastering sajilo (cost kam)
3. **Strong enough** for most constructions (100+ kg/cm²)
4. **Best value** = customer happy
5. **No advance payment** required

**When to use other bricks:**

**Use 101 Bricks (Rs 15) if:**
• Foundation kaam ho
• Pillars banaune ho
• High-rise building ho
• Maximum strength chahiyo

**Use NTB Local (Rs 14.5) if:**
• Bhaktapur ma ho
• Advance pay garna saknuhuncha
• Local bricks support garnu chahanuhuncha

---
**⭐ FINAL ADVICE:**

**C.M. Bricks** - **Best for 90% of constructions!**

📞 **Personalized advice:** 9851210449`;
}

function generateContactInfo(): string {
  return `📞 **Contact eBricks**

**Primary Contact:**
**Sachin** - Owner/Manager
📱 **Phone:** 9851210449
⏰ **Hours:** 7 AM - 7 PM (Mon-Sat)

**Best Time to Call:**
• Morning: 8-10 AM
• Afternoon: 2-5 PM

**Other Contact Methods:**
💬 **WhatsApp:** 9851210449
📱 **Viber:** 9851210449

**Emergency/Urgent Orders:**
7 AM - 7 PM kunai pani time call garnu

**📞 Call now:** 9851210449
**We speak:** Nepali, English, Hindi`;
}

function generateBookingInfo(): string {
  return `📋 **Booking Process**

**How to Book:**

1. **Call:** 9851210449 (Sachin)
2. **Discuss:** Your requirements & get a "Price Drop" quote
3. **Deposit:** Pay advance deposit to confirm your booking
4. **Confirm:** Brick type & quantity (Minimum 50,000 units)
5. **Schedule:** Delivery date & time (Free Delivery included)

**What you need:**
• Brick type (101, C.M., NTB)
• Quantity (Minimum 50,000 bricks)
• Delivery address
• Contact number
• Deposit slip/screenshot

**Payment Options:**
• Cash
• Banking Facilities (Advance deposit mandatory for booking)

**Special Offers:**
• Price Drop: Special discounted rates applied on booking
• Free Delivery: Zero shipping charges on current bookings!

**Delivery Timeline:**
• Inside Ring Road: After 7 pm

📞 **Book now to save:** 9851210449 `;
}

// Other existing functions (keep them as they are)
function generateQualityInfo(): string {
  return `🏆 **Quality Standards**

**Hamro sabai bricks:**
✓ Grade A quality
✓ Same size & shape
✓ Kam breakage
✓ Same color

**Strength Comparison:**
• **101 Bricks:** 120+ kg/cm² 🥇 (Strongest)
• **C.M. Bricks:** 100+ kg/cm² 🥈 (Best Value)
• **NTB Local:** 90+ kg/cm² 🥉 (Bhaktapur)

**Hamile quality guarantee dinchau!** 📞 9851210449`;
}

function generateComparison(): string {
  return `⚖️ **Brick Comparison Guide**

**C.M. BRICKS (Rs 14)** ⭐ WINNER
✅ **Ramro huncha:** Ghar, walls, general construction
✅ **Strength:** 100+ kg/cm²
✅ **Finish:** Smooth - plastering kam
✅ **Price:** Sabai bhanda affordable
✅ **Payment:** COD available

**101 BRICKS (Rs 15)** 💪 STRONGEST
✅ **Ramro huncha:** Foundation, pillars, high-rise
✅ **Strength:** 120+ kg/cm² (+20%)
✅ **Durability:** Maximum
✅ **Safety:** Critical structures
❌ **Price:** Rs 1 mahango

**NTB LOCAL (Rs 14.5)** 📍 BHAKTAPUR
✅ **Ramro huncha:** Bhaktapur locals
✅ **Price:** Medium range
✅ **Local:** Support community
⚠️ **Conditions:** Advance payment
⚠️ **Area:** Bhaktapur matra

**Quick Decision:**

**C.M. linus if:** Ghar banaune, best value chahiyo
**101 linus if:** Foundation kaam, maximum safety
**NTB linus if:** Bhaktapur ma, advance tire

📞 **Confusion bhaye call:** 9851210449`;
}

function generateCalculation(quantity: number): string {
  const trips = Math.ceil(quantity / 2000);
  const price101 = quantity * 15;
  const priceCM = quantity * 14;
  const priceNTB = quantity * 14.5;
  const savingsCM = price101 - priceCM;
  const savingsPercent = Math.round((savingsCM / price101) * 100);
  
  return `🧮 **Calculation for ${quantity.toLocaleString()} Bricks**

**Basic Info:**
• 1 Trip = 2,000 bricks
• Tapai ko order: ${quantity.toLocaleString()} bricks
• Trip chaincha: ${trips} trip${trips > 1 ? 's' : ''}

**Price Comparison:**

**101 Bricks (Premium):**
${quantity.toLocaleString()} × Rs 15 = **Rs ${price101.toLocaleString()}**

**C.M. Bricks (Recommended):** ⭐
${quantity.toLocaleString()} × Rs 14 = **Rs ${priceCM.toLocaleString()}**
💰 **Rs ${savingsCM.toLocaleString()} bachhaunuhuncha (${savingsPercent}%)!**

**NTB Local (Bhaktapur):**
${quantity.toLocaleString()} × Rs 14.5 = **Rs ${priceNTB.toLocaleString()}**
⚠️ Advance payment required

📞 **Book garnu:** 9851210449`;
}

function generatePaymentInfo(): string {
  return `💳 **Payment Options**

**Cash on Delivery (COD):** ✅
• Delivery pachi pay garnu
• Popular & safe
• 101 & C.M. ko lagi available

**Advance Payment Options:**
1. **Bank Transfer** (Citizens Bank)
2. **Digital Payment** (eSewa, Fonepay)
3. **Cash Advance**

**NTB BRICKS:**
⚠️ **Advance Payment REQUIRED**
• COD option chaina
• Payment pahila, delivery pachi

**Payment help chaina?**
📞 **9851210449** (Sachin)`;
}

function generateTimingInfo(): string {
  return `⏰ **Delivery Timeline**

**Standard Delivery:**
• **Aaja order → Bholi delivery** (7 PM pachi)
• Ring Road area bhitra
• Free delivery

**Delivery Hours:**
• **Free delivery:** 7 PM pachi daily
• **Paid delivery:** Kunai pani time
• **Weekends:** Available

**Urgent/Rush Delivery:**
📞 Call **9851210449** immediately!`;
}

function generateLocationInfo(): string {
  return `📍 **eBricks Service Areas**

**Kathmandu Valley:**
• Kathmandu: 101, C.M. Bricks
• Lalitpur: 101, C.M. Bricks
• Bhaktapur: 101, C.M., **NTB** Bricks

**Valley bahira:**
• Available on request
• Delivery charges apply
• 3-7 days timeline

**📍 Special Note:**
NTB Local Bricks Bhaktapur Municipality matra.

📞 **Check availability:** 9851210449`;
}

function generateProjectAdvice(): string {
  return `🏗️ **Project Advice**

**General Guidelines:**

**Strength-Critical Areas:**
• Foundation: 101 Bricks
• Pillars: 101 Bricks
• Load-bearing walls: 101 Bricks

**Non-Critical Areas:**
• Partition walls: C.M. Bricks
• Boundary walls: C.M. Bricks
• Interior walls: C.M. Bricks

**Consider these factors:**
1. Building height (floors)
2. Soil condition
3. Earthquake zone
4. Budget
5. Long-term plans

**Professional Advice:**
📞 **Site-specific advice:** 9851210449`;
}

function generateFlexibleResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('delivery')) {
    return generateDeliveryInfo();
  }
  
  if (lowerPrompt.includes('price') || lowerPrompt.includes('kati') || lowerPrompt.includes('dam')) {
    return generatePriceInfo();
  }
  
  if (lowerPrompt.includes('kun') || lowerPrompt.includes('ramro') || lowerPrompt.includes('recommend')) {
    return generateRecommendation();
  }
  
  if (lowerPrompt.includes('book') || lowerPrompt.includes('order')) {
    return generateBookingInfo();
  }
  
  if (lowerPrompt.includes('call') || lowerPrompt.includes('contact') || lowerPrompt.includes('number')) {
    return generateContactInfo();
  }
  
  return generateGenericHelpResponse();
}

function generateFallbackResponse(prompt: string): string {
  return `🤖 **I didn't fully understand your question about:**
"${prompt}"

**But I can definitely help with:**

💰 **Pricing:** "101 ko price kati?"
🚚 **Delivery:** "Delivery kaha samma huncha?"
💎 **Quality:** "Kun brick ramro cha?"
🧮 **Calculation:** "5000 bricks ko kati lagcha?"

📞 **Direct help:** 9851210449 (Sachin)`;
}

function generateGenericHelpResponse(): string {
  return `🤔 **I'm here to help with all brick-related questions!**

**Quick Information:**

💰 **Prices (per brick):**
• 101 Bricks: Rs 15
• C.M. Bricks: Rs 14 ⭐ BEST VALUE
• NTB Local: Rs 14.5 (Bhaktapur only)

🚚 **Delivery:**
• Ring Road: Free (after 7 PM)
• Outside: Charges apply

**Ask me anything specific or call:**
📞 **9851210449** (Sachin)
⏰ 7 AM - 7 PM`;
}

// Quick reply suggestions - EXPORTED PROPERLY
export const getQuickReplies = (): string[] => {
  return [
    "Kun kun brick cha?",
    "Price kati cha?",
    "Delivery charge?",
    "Kun brick ramro?"
  ];
};

// Export the main function only
export default {
  getSmartAssistance,
  getQuickReplies
};