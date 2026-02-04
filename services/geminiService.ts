
// Simple API key getter
const getApiKey = (): string => {
  // Use type assertion to avoid TypeScript errors
  const env = (import.meta as any).env;
  return env?.VITE_GEMINI_API_KEY || '';
};

const apiKey = getApiKey();
console.log('API Key available:', !!apiKey);

export const getSmartAssistance = async (prompt: string): Promise<string> => {
  // Always return mock response for now
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('delivery') || lowerPrompt.includes('charge') || lowerPrompt.includes('kati')) {
    return "Delivery charges: Ring Road area delivery is FREE but only after 7 PM. Outside Ring Road charges vary by location (typically NPR 50-100 per brick). For exact charges, call Sachin at 9851210449.";
  }
  
  if (lowerPrompt.includes('price') || lowerPrompt.includes('rate') || lowerPrompt.includes('paisa')) {
    return "Current prices: 101 Bricks = Rs 15 per unit, C.M. Bricks = Rs 14 per unit. Minimum: 1 Trip = 2000 bricks. 50k+ = booking order.";
  }
  
  if (lowerPrompt.includes('trip') || lowerPrompt.includes('calculate')) {
    return "1 Trip = 2000 bricks. Example: 10,000 bricks = 5 trips. Price: 10,000 × 15 = NPR 150,000 for 101 Bricks. Call 9851210449 for bulk discounts!";
  }
  
  if (lowerPrompt.includes('quality') || lowerPrompt.includes('standard')) {
    return "Grade A, ISI certified bricks with 100+ kg/cm² compressive strength. Best quality in Nepal!";
  }
  
  if (lowerPrompt.includes('time') || lowerPrompt.includes('samaya') || lowerPrompt.includes('kaile')) {
    return "Delivery: Within Ring Road - next day after 7 PM. Outside - 3-7 days. Call 9851210449 for urgent delivery.";
  }
  
  if (lowerPrompt.includes('namaste') || lowerPrompt.includes('hello')) {
    return "Namaste! Hajurlai 𝓮Bricks ma swagat cha! Brick price, delivery, quality ya booking bare sodhnus!";
  }

 if (lowerPrompt.includes('kun') || lowerPrompt.includes('ramro') || lowerPrompt.includes('itta') || lowerPrompt.includes('which') || lowerPrompt.includes('recommend')) {
  return "Hami recommend garchau C.M. Bricks linus! Yo kina bhanne:\n\nC.M. Bricks (Rs 14/unit) - Hamro sifaris:\n✓ Sasto ra bharpardoo (Best value for money)\n✓ Smooth surface - plastering sajilo huncha\n✓ Uniform size & color - construction ramro dekhincha\n✓ Ghar, boundary walls, residential sabai ma ramro\n✓ 100+ kg/cm² strength - sadhai tikau\n\nProject anusar recommendation:\n• Ghar ko foundation/pillar: 101 Bricks (Rs 15) - Extra strong\n• Samanya ghar/bhavan: C.M. Bricks - Perfect balance!\n• Budget friendly: C.M. Bricks - Quality in affordable price\n• Finishing/Sajawat: Machine Made - Uniform look\n\nHajur ko project kasto cha? Call 9851210449 for personalized advice!\n\nNote: 95% customers C.M. Bricks nai linchhan ra khushi chhan!";
}

if (lowerPrompt.includes('c.m.') || lowerPrompt.includes('cm brick') || lowerPrompt.includes('cm')) {
  return "C.M. Bricks (Rs 14/unit) - Hamro mukhya utpadan:\n\nFaidaharu:\n• 14 Rs ma Grade A quality\n• Sabai residential project haru ko lagi perfect\n• Plastering ma cement kam lagcha\n• Transportation ma breakage hudaina\n• Har batch ma same quality\n\nKasle linuparcha?\n• First-time ghar banune haru\n• Budget ma hune customers\n• Pura ghar construction\n• Boundary walls & compound walls\n• 2-3 storey residential buildings\n\nPhone garnus 9851210449 - Hami C.M. Bricks ko sample pani dekhauna sakchau!";
}

if (lowerPrompt.includes('compare') || lowerPrompt.includes('difference') || lowerPrompt.includes('101 vs')) {
  return "101 Bricks vs C.M. Bricks Comparison:\n\nC.M. Bricks (Rs 14):\n✓ Hamro sifaris!\n✓ Best for: Ghar, bhavan, boundary walls\n✓ Smooth finish - plaster kam moto rakhna pardaina\n✓ Cost-effective quality\n✓ Sabai bhanda popular choice\n\n101 Bricks (Rs 15):\n✓ Extra strength (120+ kg/cm²)\n✓ Best for: Foundation, pillars, high-rise\n✓ Dhurai tikau but rough surface\n✓ 1 Rs mahango per brick\n\nSujhab:\n• General construction: C.M. Bricks linus\n• Critical structures: 101 Bricks linus\n• Mix option: Foundation-101, Walls-C.M.\n\nCall 9851210449 for FREE consultation!";
}

if (lowerPrompt.includes('budget') || lowerPrompt.includes('sasto') || lowerPrompt.includes('cheap') || lowerPrompt.includes('affordable')) {
  return "Budget-friendly solution:\n\nC.M. Bricks at Rs 14 - Best quality in affordable price!\n\nSavings calculate garnus:\n• 10,000 bricks = Rs 140,000 (C.M.) vs Rs 150,000 (101)\n• Hajurle bachaunuhuncha: Rs 10,000\n\nC.M. local sasto bricks bhanda kina ramro:\n1. ISI Certified - Quality guaranteed\n2. Uniform size - Cement waste kam huncha\n3. Breakage ko kharcha pardaina\n4. Long-term tikau\n\nCall 9851210449 - Hami hajurlai paisa bachaauna madat garchau, quality compromise nagari!";
}

if (lowerPrompt.includes('review') || lowerPrompt.includes('experience') || lowerPrompt.includes('testimonial') || lowerPrompt.includes('customer')) {
  return "Customer Reviews (C.M. Bricks):\n\nC.M. Bricks ramro bhayo! Plastering sajilo, quality thik, price pani reasonable. - Rajesh, Bhaktapur\n\n101 bhanda C.M. nai ramro lagyo. 2 ota ghar ma prayog garisake, dubai ma khushi! - Sita, Kathmandu\n\nSachin dai le recommend gareko C.M. bricks, exactly as described. Dhanyabad! - Amit, Lalitpur\n\n1000+ satisfied customers sanga join garnus! Call 9851210449";
}

if (lowerPrompt.includes('ghar') || lowerPrompt.includes('house') || lowerPrompt.includes('home')) {
  return "Ghar ko lagi recommendation:\n\nC.M. Bricks (Rs 14) - Ghar banuna perfect!\n\nKina C.M. ghar ko lagi ramro:\n1. Plastering ramro hunxa\n2. Wall smooth dekhinxa\n3. Long-term ma problem aaudaina\n4. Budget friendly - ghar banuna sajilo\n\nAru options:\n• Foundation/pillar: 101 Bricks\n• Walls: C.M. Bricks\n• Sajawat: Machine Made\n\nCall 9851210449 - Hamile ghar design anusar bricks recommend garchau!";
}

if (lowerPrompt.includes('business') || lowerPrompt.includes('commercial') || lowerPrompt.includes('office')) {
  return "Business building ko lagi:\n\nRecommendation:\n• Ground floor/Foundation: 101 Bricks\n• Upper floors: C.M. Bricks\n\nKina yo combination:\n✓ Strength ra cost balance huncha\n✓ Safety ra budget duitai maintain huncha\n✓ Professional look aauxa\n\nBulk order discount pani available! Call 9851210449";
}
  // 2. Payment Methods (COD & Bank Transfer)
  else if (lowerPrompt.includes('payment') || lowerPrompt.includes('cash') || lowerPrompt.includes('cod') || lowerPrompt.includes('bank')) {
    return "Hamile Cash on Delivery (COD) accept garchau—itta jharepachi matrai paisa tirnus! \nOnline ko lagi: \n- Bank Transfer: Citizens Bank (Current A/C: 001XXXXXXXXXXX) \n- Digital: ConnectIPS, eSewa, athawa Fonepay QR. \nDirect bank transfer garne bhae Sachin (9851210449) lai screenshot pathunus.";
}
  return "Dhanyabad! Brick ko bare ma detail ma jankari ko lagi, price, delivery charge, quality, athawa trip calculation bare sodhnus. Ya call garnus Sachin lai 9851210449 ma.";
  
  // Note: The Gemini API code is commented out for now
  // You can uncomment it once you fix the TypeScript types
  
  /*
  if (!apiKey) {
    return "Smart assistant is currently upgrading. Please call Sachin at 9851210449 for immediate assistance!";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });
    
    const response = result.response;
    if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text;
    }
    
    return "I couldn't generate a response. Please try again or call 9851210449.";
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting. Please call Sachin at 9851210449 for direct assistance!";
  }
  */
};