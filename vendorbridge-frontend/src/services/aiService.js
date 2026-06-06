// Mock AI Service for Lightning Fast Hackathon Demos

export const generateRFQFromText = async (userInput) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate NLP processing of the user's string
      const text = userInput.toLowerCase();
      
      let title = "Office Supplies Procurement";
      let category = "General";
      const items = [];
      let deadline = new Date();
      deadline.setDate(deadline.getDate() + 7); // Default 7 days

      if (text.includes("laptop") || text.includes("computer") || text.includes("monitor")) {
        title = "IT Hardware Procurement";
        category = "IT & Software";
      } else if (text.includes("desk") || text.includes("chair")) {
        title = "Office Furniture Setup";
        category = "Office Supplies";
      }

      // Simple regex to extract quantities and items like "50 laptops"
      const matches = userInput.match(/(\d+)\s+([a-zA-Z\s]+)/g);
      if (matches) {
        matches.forEach(match => {
          const parts = match.trim().split(' ');
          const qty = parseInt(parts[0]);
          const name = parts.slice(1).join(' ').replace(/and|with/g, '').trim();
          if (qty && name.length > 2) {
            // Give it a mock price based on name
            let price = 500;
            if (name.includes('Laptop') || name.includes('laptop')) price = 65000;
            if (name.includes('Monitor') || name.includes('monitor')) price = 15000;
            if (name.includes('Chair') || name.includes('chair')) price = 8000;
            
            items.push({
              productName: name.charAt(0).toUpperCase() + name.slice(1),
              quantity: qty,
              unit: 'pcs',
              description: `AI Extracted: ${name}`
            });
          }
        });
      }

      // Fallback if regex missed
      if (items.length === 0) {
        items.push({ productName: "Extracted Item", quantity: 1, unit: 'pcs', description: userInput });
      }

      // If text mentions "Friday" or "next week", set deadline
      if (text.includes("friday")) deadline.setDate(deadline.getDate() + (5 - deadline.getDay() + 7) % 7);
      else if (text.includes("urgent")) deadline.setDate(deadline.getDate() + 2);

      resolve({
        title,
        category,
        items,
        deadline: deadline.toISOString().split('T')[0],
        budget: items.reduce((acc, it) => acc + (it.quantity * 5000), 0),
        notes: `AI Generated from prompt: "${userInput}"`
      });
    }, 1500); // 1.5s artificial delay for "AI thinking" effect
  });
};

export const analyzeQuotations = async (rfqTitle, quotations) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!quotations || quotations.length === 0) {
        resolve("Not enough quotes to analyze.");
        return;
      }

      // Find the best quote mathematically using correct field names
      const sorted = [...quotations].sort((a, b) => a.totalPrice - b.totalPrice);
      const cheapest = sorted[0];
      const mostExpensive = sorted[sorted.length - 1];

      const fastestArr = [...quotations].sort((a, b) => (a.deliveryDays || 999) - (b.deliveryDays || 999));
      const fastest = fastestArr[0];

      const savings = mostExpensive.totalPrice - cheapest.totalPrice;
      const savingsPct = mostExpensive.totalPrice > 0 ? Math.round((savings / mostExpensive.totalPrice) * 100) : 0;

      if (quotations.length === 1) {
        resolve(`✨ **AI Recommendation:** Only one bid received from **${cheapest.vendorName}** at ₹${cheapest.totalPrice.toLocaleString()} with ${cheapest.deliveryDays || 'N/A'} day delivery. Recommend proceeding if the price is within budget.`);
        return;
      }

      if (cheapest.vendorName === fastest.vendorName) {
        resolve(`✨ **AI Recommendation:** **${cheapest.vendorName}** is the clear winner for "${rfqTitle}". They offer the lowest price of ₹${cheapest.totalPrice.toLocaleString()} AND the fastest delivery of ${cheapest.deliveryDays} days — saving you ₹${savings.toLocaleString()} (${savingsPct}%) compared to the highest bid. Proceeding with them maximizes both cost savings and operational efficiency.`);
      } else {
        const priceDiff = fastest.totalPrice - cheapest.totalPrice;
        resolve(`✨ **AI Recommendation:** For "${rfqTitle}", **${cheapest.vendorName}** offers the best price at ₹${cheapest.totalPrice.toLocaleString()}, saving ₹${savings.toLocaleString()} (${savingsPct}%) vs the highest bid. If speed is critical, **${fastest.vendorName}** delivers in ${fastest.deliveryDays} days for an additional ₹${priceDiff.toLocaleString()}. Based on cost-efficiency, **${cheapest.vendorName} is recommended**.`);
      }
    }, 1200);
  });
};

export const calculateVendorRisk = (vendor) => {
  // Mock risk calculation based on vendor ID or category
  const idStr = String(vendor.id || '100');
  const hash = idStr.charCodeAt(0) + idStr.charCodeAt(idStr.length - 1);
  
  if (hash % 5 === 0) return { score: 85, level: 'High', color: 'red' };
  if (hash % 3 === 0) return { score: 65, level: 'Medium', color: 'yellow' };
  return { score: 15, level: 'Low', color: 'green' };
};
