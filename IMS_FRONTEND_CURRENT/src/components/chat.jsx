// src/components/Chat.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Maximize2,
  Minimize2,
  Send,
  RotateCcw,
  Box,
  Users,
  Archive,
  Tag,
  Sparkles,
  Settings,
} from "lucide-react";

/**
 * Chat.jsx
 *
 * Full-feature Chat component:
 *  - Flows: customer, supplier, warehouse, product, category (create)
 *  - Trigger phrase detection
 *  - "Even mode" / continue-adding checks
 *  - API submit behavior preserved:
 *      - customer/supplier => POST with query params
 *      - warehouse/product/category => POST JSON body
 *  - UI: vivid orange gradient theme (Tailwind classes + inline gradients)
 *  - AI general search:
 *      - Providers: OpenAI (gpt-3.5-turbo) and Google Gemini (generativelanguage)
 *      - Provider selection + keys in settings modal
 *      - Env var precedence: import.meta.env.VITE_OPENAI_API_KEY / VITE_GEMINI_API_KEY
 *      - Localstorage fallback for keys
 *  - Gemini payload parsing fixed for generateContent response
 *
 * Designed for Vite (import.meta.env). If using CRA, replace env access accordingly.
 *
 * NOTE: This file is intentionally verbose to preserve lines/logic.
 */

const Chat = () => {
  // -------------------- UI State --------------------
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Welcome! I’m your virtual assistant.", time: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null); // null | 'customer' | 'supplier' | 'warehouse' | 'product' | 'category'
  const [formdata, setFormData] = useState({});
  const messagesEndRef = useRef(null);

console.log("AI provider:",formdata); 

  // Settings modal and AI provider inputs
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [aiProvider, setAiProvider] = useState(() => {
    const envOpenAI = import.meta.env.VITE_OPENAI_API_KEY;
    const envGemini = import.meta.env.VITE_GEMINI_API_KEY;
    if (envOpenAI) return "openai";
    if (envGemini) return "gemini";
    const localOpen = localStorage.getItem("openai_key");
    const localGem = localStorage.getItem("gemini_key");
    if (localOpen) return "openai";
    if (localGem) return "gemini";
    return "openai";
  });

  
const [isCallingAI, setIsCallingAI] = useState(false);
  const [autoFallbackAI, setAutoFallbackAI] = useState(true);

  // -------------------- API Endpoints for ERP --------------------
  const API = {
    customer: "http://127.0.0.1:8000/customers/",
    supplier: "http://127.0.0.1:8000/suppliers/",
    warehouse: "http://127.0.0.1:8000/warehouse/",
    product: "http://127.0.0.1:8000/products/",
    category: "http://127.0.0.1:8000/categories",
  };

  // -------------------- Trigger phrase arrays --------------------
  const customerTriggers = [
    "add customer","create customer","new customer","register customer","i want to add a customer","make a customer",
    "add new customer","insert customer","customer entry","add client","add buyer","customer registration",
    "create new customer","add customer info","enter customer details"
  ];
  const supplierTriggers = [
    "add supplier","create supplier","new supplier","register supplier","i want to add a supplier","make a supplier",
    "add new supplier","insert supplier","supplier entry","add vendor","vendor registration","create new supplier",
    "add supplier info","enter supplier details","register a vendor"
  ];
  const warehouseTriggers = [
    "add warehouse","create warehouse","new warehouse","register warehouse","i want to add a warehouse","make a warehouse",
    "add new warehouse","insert warehouse","warehouse entry","add storage","add stock location","create new warehouse",
    "add warehouse info","register storage unit","warehouse registration"
  ];
  const productTriggers = [
    "add product","create product","new product","register product","i want to add a product","make a product",
    "add new product","insert product","product entry","add item","add to inventory","create new product",
    "add product info","enter product details","register a product"
  ];
  const categoryTriggers = [
    "add category","create category","new category","register category","i want to add a category","make a category",
    "add new category","insert category","category entry","add group","add type","create new category",
    "add category info","enter category details","register a category"
  ];

  const matchesTrigger = (triggers, text) => {
    if (!text || !triggers || !Array.isArray(triggers)) return false;
    return triggers.some((t) => text.includes(t));
  };

  // -------------------- Utilities --------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (step === 0) {
      setTimeout(() => {
        addBot("What would you like to add today? Customer, Supplier, Warehouse, Product, or Category?");
      }, 650);
    }
  }, [step]);

  const addBot = (text, buttons) =>
    setMessages(prev => [...prev, { sender: "bot", text, buttons: buttons || null, time: new Date() }]);

  const addUser = (text) =>
    setMessages(prev => [...prev, { sender: "user", text, time: new Date() }]);

  const addBotWithButtons = (text, buttons) => addBot(text, buttons);

  const replaceLastThinking = (replacementText, buttons) =>
    setMessages(prev => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].sender === "bot" && prev[i].thinking) {
          const copy = [...prev];
          copy[i] = { sender: "bot", text: replacementText, buttons: buttons || null, time: new Date() };
          return copy;
        }
      }
      return [...prev, { sender: "bot", text: replacementText, buttons: buttons || null, time: new Date() }];
    });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  const validatePhone = (phone) => /^[0-9]{7,15}$/.test(String(phone || "").trim());
  const validateDate = (date) => !isNaN(Date.parse(String(date || "")));
  const validateNumber = (num) => !isNaN(Number(num)) && String(num).trim() !== "";

  const buildParams = (obj) => {
    const params = new URLSearchParams();
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (typeof v === "boolean") params.append(k, v ? "true" : "false");
      else if (typeof v === "object") params.append(k, JSON.stringify(v));
      else params.append(k, String(v));
    });
    return params.toString();
  };

  // -------------------- AI Key helpers --------------------
  const getOpenAIKey = () => {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey && envKey.startsWith("sk-")) return envKey;
    const local = localStorage.getItem("openai_key");
    if (local && local.startsWith("sk-")) return local;
    return null;
  };

  const getGeminiKey = () => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim()) return envKey;
    const local = localStorage.getItem("gemini_key");
    if (local && local.trim()) return local;
    return null;
  };

  const saveOpenAIKeyLocal = () => {
    if (!openaiKeyInput || !openaiKeyInput.startsWith("sk-")) {
      addBot("OpenAI keys usually start with sk-. Please check and try again.");
      return;
    }
    localStorage.setItem("openai_key", openaiKeyInput.trim());
    setOpenaiKeyInput("");
    addBot("OpenAI key saved locally.");
  };

  const saveGeminiKeyLocal = () => {
    if (!geminiKeyInput || geminiKeyInput.trim() === "") {
      addBot("Please paste your Gemini key.");
      return;
    }
    localStorage.setItem("gemini_key", geminiKeyInput.trim());
    setGeminiKeyInput("");
    addBot("Gemini key saved locally.");
  };

  const clearOpenAIKeyLocal = () => {
    localStorage.removeItem("openai_key");
    addBot("OpenAI key cleared from local storage.");
  };

  const clearGeminiKeyLocal = () => {
    localStorage.removeItem("gemini_key");
    addBot("Gemini key cleared from local storage.");
  };

  // -------------------- AI call helpers --------------------
  const callOpenAIChat = async (userQuery) => {
    const key = getOpenAIKey();
    if (!key) {
      addBotWithButtons("I don't have an OpenAI key. Save one in settings to enable OpenAI provider.", ["Open Settings"]);
      return { ok: false, error: "no_key" };
    }

    setMessages(prev => [...prev, { sender: "bot", text: "Thinking (OpenAI)...", thinking: true, time: new Date() }]);
    setIsCallingAI(true);

    try {
      const payload = {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that answers user questions concisely and clearly." },
          { role: "user", content: userQuery },
        ],
        temperature: 0.2,
        max_tokens: 800,
      };

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errText = `Status ${res.status}`;
        try {
          const js = await res.json().catch(() => null);
          if (js && js.error) errText = js.error.message || JSON.stringify(js.error);
        } catch {}
        replaceLastThinking(`OpenAI error: ${errText}`);
        return { ok: false, error: errText };
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "No response from OpenAI.";
      replaceLastThinking(content);
      return { ok: true };
    } catch (e) {
      replaceLastThinking(`OpenAI call error: ${String(e.message || e)}`);
      return { ok: false, error: e?.message || String(e) };
    } finally {
      setIsCallingAI(false);
    }
  };

  const callGemini = async (userQuery) => {
    const key = getGeminiKey();
    if (!key) {
      addBotWithButtons("I don't have a Gemini key. Save one in settings to enable Gemini provider.", ["Open Settings"]);
      return { ok: false, error: "no_key" };
    }

    setMessages(prev => [...prev, { sender: "bot", text: "Thinking (Gemini)...", thinking: true, time: new Date() }]);
    setIsCallingAI(true);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${encodeURIComponent(key)}`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: userQuery }],
          },
        ],
        temperature: 0.2,
        candidateCount: 1,
        maxOutputTokens: 800,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errText = `Status ${res.status}`;
        try {
          const js = await res.json().catch(() => null);
          if (js && js.error) errText = js.error.message || JSON.stringify(js.error);
        } catch {}
        replaceLastThinking(`Gemini error: ${errText}`);
        return { ok: false, error: errText };
      }

      const data = await res.json();

      let content = "";
      if (data?.candidates && data.candidates[0]?.content) {
        const cand = data.candidates[0];
        if (Array.isArray(cand.content)) {
          for (const c of cand.content) {
            if (c?.parts && Array.isArray(c.parts) && c.parts[0]?.text) {
              content = c.parts.map(p => p.text).join("\n");
              break;
            }
          }
        } else if (cand.content?.parts && cand.content.parts[0]?.text) {
          content = cand.content.parts.map(p => p.text).join("\n");
        } else if (typeof cand.content === "string") {
          content = cand.content;
        }
      } else if (data?.outputs && data.outputs[0]?.content?.[0]?.text) {
        content = data.outputs[0].content[0].text;
      } else if (typeof data?.output === "string") {
        content = data.output;
      } else {
        content = JSON.stringify(data);
      }

      replaceLastThinking(content);
      return { ok: true };
    } catch (e) {
      replaceLastThinking(`Gemini call error: ${String(e.message || e)}`);
      return { ok: false, error: e?.message || String(e) };
    } finally {
      setIsCallingAI(false);
    }
  };

  const callSelectedAI = async (text) => {
    if (aiProvider === "openai") {
      const result = await callOpenAIChat(text);
      if (!result.ok && autoFallbackAI) {
        const fallback = await callGemini(text);
        return fallback;
      }
      return result;
    } else {
      const result = await callGemini(text);
      if (!result.ok && autoFallbackAI) {
        const fallback = await callOpenAIChat(text);
        return fallback;
      }
      return result;
    }
  };

  // -------------------- Main handleSend --------------------
  const handleSend = async (textOverride = null) => {
    const userText = (textOverride ?? input ?? "").trim();
    if (!userText) return;
    addUser(userText);
    setInput("");
    const lower = userText.toLowerCase();

    if (!mode) {
      if (matchesTrigger(customerTriggers, lower)) {
        setMode("customer");
        addBot("Let's add a new customer! What's the first name?");
        setStep(1);
        return;
      }
      if (matchesTrigger(supplierTriggers, lower)) {
        setMode("supplier");
        addBot("Let's add a new supplier! What's the first name?");
        setStep(100);
        return;
      }
      if (matchesTrigger(warehouseTriggers, lower)) {
        setMode("warehouse");
        addBot("Let's add a new warehouse! What's the warehouse name?");
        setStep(200);
        return;
      }
      if (matchesTrigger(productTriggers, lower)) {
        setMode("product");
        addBot("Let's add a new product! What's the product name?");
        setStep(300);
        return;
      }
      if (matchesTrigger(categoryTriggers, lower)) {
        setMode("category");
        addBot("Let's add a new category! What's the category name?");
        setStep(400);
        return;
      }

      await callSelectedAI(userText);
      return;
    }

    // ---------------- CUSTOMER FLOW ----------------
    if (mode === "customer") {
      switch (step) {
        case 1:
          setFormData({ first_name: userText });
          addBot("Last name?");
          setStep(2);
          break;
        case 2:
          setFormData(p => ({ ...p, last_name: userText }));
          addBot("Email?");
          setStep(3);
          break;
        case 3:
          if (!validateEmail(userText)) {
            addBot("Invalid email. Please enter a valid email address.");
            return;
          }
          setFormData(p => ({ ...p, email: userText }));
          addBot("Phone?");
          setStep(4);
          break;
        case 4:
          if (!validatePhone(userText)) {
            addBot("Invalid phone number. Use digits only (7–15).");
            return;
          }
          setFormData(p => ({ ...p, phone: userText }));
          addBot("Address?");
          setStep(5);
          break;
        case 5:
          setFormData(p => ({ ...p, address: userText }));
          addBot("City?");
          setStep(6);
          break;
        case 6:
          setFormData(p => ({ ...p, city: userText }));
          addBot("State?");
          setStep(7);
          break;
        case 7:
          setFormData(p => ({ ...p, state: userText }));
          addBot("Country?");
          setStep(8);
          break;
        case 8:
          setFormData(p => ({ ...p, country: userText }));
          addBot("Postal code?");
          setStep(9);
          break;
        case 9:
          {
            const cdata = { ...formData, postal_code: userText, status: "Active" };
            await submitJSON("customer", cdata);
            addBotWithButtons("Would you like to add another customer?", ["Yes", "No"]);
            setStep(50);
          }
          break;
        case 50:
          if (lower.includes("yes")) {
            addBot("Great — what's the first name of the next customer?");
            setFormData({});
            setStep(1);
          } else {
            addBot("Okay — returning to the main menu.");
            reset();
          }
          break;
        default:
          break;
      }
      return;
    }

    // ---------------- SUPPLIER FLOW ----------------
    if (mode === "supplier") {
      switch (step) {
        case 100:
          setFormData({ first_name: userText });
          addBot("Last name?");
          setStep(101);
          break;
        case 101:
          setFormData(p => ({ ...p, last_name: userText }));
          addBot("Email?");
          setStep(102);
          break;
        case 102:
          if (!validateEmail(userText)) {
            addBot("Invalid email. Please enter a valid email address.");
            return;
          }
          setFormData(p => ({ ...p, email: userText }));
          addBot("Phone?");
          setStep(103);
          break;
        case 103:
          if (!validatePhone(userText)) {
            addBot("Invalid phone number. Use digits only (7–15).");
            return;
          }
          setFormData(p => ({ ...p, phone: userText }));
          addBot("Address?");
          setStep(104);
          break;
        case 104:
          setFormData(p => ({ ...p, address: userText }));
          addBot("City?");
          setStep(105);
          break;
        case 105:
          setFormData(p => ({ ...p, city: userText }));
          addBot("State?");
          setStep(106);
          break;
        case 106:
          setFormData(p => ({ ...p, state: userText }));
          addBot("Country?");
          setStep(107);
          break;
        case 107:
          setFormData(p => ({ ...p, country: userText }));
          addBot("Postal code?");
          setStep(108);
          break;
        case 108:
          {
            const sdata = { ...formData, postal_code: userText, status: "Active" };
            await submitJSON("supplier", sdata);
            addBotWithButtons("Would you like to add another supplier?", ["Yes", "No"]);
            setStep(150);
          }
          break;
        case 150:
          if (lower.includes("yes")) {
            addBot("Ok — what's the first name of the next supplier?");
            setFormData({});
            setStep(100);
          } else {
            addBot("Returning to main menu.");
            reset();
          }
          break;
        default:
          break;
      }
      return;
    }

    // ---------------- WAREHOUSE FLOW ----------------
    if (mode === "warehouse") {
      switch (step) {
        case 200:
          setFormData({ name: userText });
          addBot("Contact person?");
          setStep(201);
          break;
        case 201:
          setFormData(p => ({ ...p, contact_person: userText }));
          addBot("Email?");
          setStep(202);
          break;
        case 202:
          if (!validateEmail(userText)) {
            addBot("Invalid email. Please enter a valid email address.");
            return;
          }
          setFormData(p => ({ ...p, email: userText }));
          addBot("Phone?");
          setStep(203);
          break;
        case 203:
          if (!validatePhone(userText)) {
            addBot("Invalid phone number. Use digits only (7–15).");
            return;
          }
          setFormData(p => ({ ...p, phone: userText }));
          addBot("Address?");
          setStep(204);
          break;
        case 204:
          setFormData(p => ({ ...p, address: userText }));
          addBot("City?");
          setStep(205);
          break;
        case 205:
          setFormData(p => ({ ...p, city: userText }));
          addBot("State?");
          setStep(206);
          break;
        case 206:
          setFormData(p => ({ ...p, state: userText }));
          addBot("Country?");
          setStep(207);
          break;
        case 207:
          setFormData(p => ({ ...p, country: userText }));
          addBot("Postal code?");
          setStep(208);
          break;
        case 208:
          {
            const wdata = {
              name: formData.name || "Unnamed Warehouse",
              contact_person: formData.contact_person || "N/A",
              phone: formData.phone || "0000000000",
              email: formData.email || "",
              address: formData.address || "",
              city: formData.city || "",
              state: formData.state || "",
              country: formData.country || "",
              postal_code: userText,
              status: "Active"
            };

            await submitJSON("warehouse", wdata);
            addBotWithButtons("Would you like to add another warehouse?", ["Yes", "No"]);
            setStep(250);
          }
          break;
        case 250:
          if (lower.includes("yes")) {
            addBot("What's the name of the next warehouse?");
            setFormData({});
            setStep(200);
          } else {
            addBot("Returning to main menu.");
            reset();
          }
          break;
        default:
          break;
      }
      return;
    }

    // ---------------- PRODUCT FLOW ----------------
    if (mode === "product") {
      switch (step) {
        case 300:
          setFormData({ product_name: userText });
          addBot("SKU?");
          setStep(301);
          break;

        case 301:
          setFormData(p => ({ ...p, sku: userText }));
          try {
            const res = await fetch(API.warehouse);
            if (!res.ok) throw new Error("Failed to fetch warehouses");
            const warehouses = await res.json();

            let names = [];
            if (Array.isArray(warehouses)) names = warehouses.map(w => w.name);
            else if (warehouses && warehouses.name) names = [warehouses.name];

            if (names.length > 0) {
              addBotWithButtons("Available Warehouses — click one below or type manually:", names);
            } else {
              addBot("No warehouses found. Please type a warehouse name manually.");
            }
          } catch (e) {
            addBot("Error fetching warehouses. Please type warehouse name manually.");
          }
          setStep(302);
          break;

        case 302:
          setFormData(p => ({ ...p, warehouse: userText }));
          try {
            const res = await fetch(API.category);
            if (!res.ok) throw new Error("Failed to fetch categories");
            const data = await res.json();
            const categories = Array.isArray(data) ? data : data.categories || [];
            if (categories.length > 0) {
              const names = categories.map(c => c.category || c.name || c.title);
              addBotWithButtons("Available Categories — click one below or type manually:", names);
            } else {
              addBot("No categories found. Please type a category name manually.");
            }
          } catch (e) {
            addBot("Error fetching categories. Please type category name manually.");
          }
          setStep(303);
          break;

        case 303:
          setFormData(p => ({ ...p, category: userText }));
          addBot("Quantity?");
          setStep(304);
          break;

        case 304:
          if (!validateNumber(userText)) {
            addBot("Please enter a valid number for Quantity.");
            return;
          }
          setFormData(p => ({ ...p, quantity: userText }));
          addBot("Price?");
          setStep(305);
          break;

        case 305:
          if (!validateNumber(userText)) {
            addBot("Please enter a valid number for Price.");
            return;
          }
          setFormData(p => ({ ...p, price: userText }));
          addBot("Cost?");
          setStep(306);
          break;

        case 306:
          if (!validateNumber(userText)) {
            addBot("Please enter a valid number for Cost.");
            return;
          }
          setFormData(p => ({ ...p, cost: userText }));
          addBot("Tax Amount?");
          setStep(307);
          break;

        case 307:
          if (!validateNumber(userText)) {
            addBot("Please enter a valid number for Tax Amount.");
            return;
          }
          setFormData(p => ({ ...p, tax_amount: userText }));
          addBotWithButtons("Does this product have a Manufactured Date and Expiry Date?", ["Yes", "No"]);
          setStep(308);
          break;

        case 308:
          if (lower.includes("yes")) {
            addBot("Manufactured Date? (YYYY-MM-DD)");
            setStep(309);
          } else {
            setFormData(p => ({ ...p, manufactured_date: null, expiry_on: null }));
            addBot("Quantity Alert?");
            setStep(311);
          }
          break;

        case 309:
          if (!validateDate(userText)) {
            addBot("Invalid date format. Please use YYYY-MM-DD.");
            return;
          }
          setFormData(p => ({ ...p, manufactured_date: new Date(userText).toISOString().split("T")[0] }));
          addBot("Expiry Date? (YYYY-MM-DD)");
          setStep(310);
          break;

        case 310:
          if (!validateDate(userText)) {
            addBot("Invalid date format. Please use YYYY-MM-DD.");
            return;
          }
          setFormData(p => ({ ...p, expiry_on: new Date(userText).toISOString().split("T")[0] }));
          addBot("Quantity Alert?");
          setStep(311);
          break;

        case 311:
          if (!validateNumber(userText)) {
            addBot("Please enter a valid number for Quantity Alert.");
            return;
          }
          {
            const pdata = {
              ...formData,
              quantity_alert: parseFloat(userText) || 0,
              quantity: parseFloat(formData.quantity) || 0,
              price: parseFloat(formData.price) || 0,
              cost: parseFloat(formData.cost) || 0,
              tax_amount: parseFloat(formData.tax_amount) || 0,
              store: "Default Store",
              selling_type: "Transactional selling",
              sub_category: "General",
              brand: "Generic",
              unit: "pc",
              barcode_symbology: "code34",
              item_code: `ITEM-${Math.floor(Math.random() * 9999)}`,
              description: "Auto-generated product",
              hsn_sac: "1001",
              preference_supply: "Local",
              tax_type: "exclusive",
              discount_type: "percentage",
              discount_value: 0,
              warranties: {
                warranty: "Standard",
                manufacturer: "System",
                manufactured_date: formData.manufactured_date || new Date().toISOString().split("T")[0],
                expiry_on: formData.expiry_on || new Date().toISOString().split("T")[0],
              },
              slug: `product-${Date.now()}`,
            };
            await submitJSON("product", pdata);
            addBotWithButtons("Would you like to add another product?", ["Yes", "No"]);
            setStep(350);
          }
          break;

        case 350:
          if (lower.includes("yes")) {
            addBot("Let's add another product! What's the product name?");
            setFormData({});
            setStep(300);
          } else {
            addBot("Okay! Returning to the main menu...");
            reset();
          }
          break;

        default:
          break;
      }
      return;
    }

    // ---------------- CATEGORY FLOW ----------------
    if (mode === "category") {
      switch (step) {
        case 400:
          setFormData({ category: userText });
          addBot("Should the category be active? (yes/no)");
          setStep(401);
          break;
        case 401:
          {
            const isActive = userText.toLowerCase().includes("yes") || userText.toLowerCase().includes("active");
            const slug = (formData.category || "").toLowerCase().trim().replace(/\s+/g, "-");
            const categoryData = { category: formData.category, category_slug: slug, status: isActive ? 1 : 0 };
            await submitJSON("category", categoryData);
            addBotWithButtons("Would you like to add another category?", ["Yes", "No"]);
            setStep(450);
          }
          break;
        case 450:
          if (lower.includes("yes")) {
            addBot("Let's add a new category! What's the category name?");
            setFormData({});
            setStep(400);
          } else {
            addBot("Okay! Returning to the main menu...");
            reset();
          }
          break;
        default:
          break;
      }
      return;
    }
  };

  // -------------------- submitJSON (FIXED) --------------------
  const submitJSON = async (type, data) => {
    try {
      let res;

      if (["customer", "supplier"].includes(type)) {
        const paramString = buildParams(data);
        const url = `${API[type]}${paramString ? `?${paramString}` : ""}`;
        res = await fetch(url, { method: "POST" });
      } else {
        res = await fetch(API[type], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        let bodyText = "";
        try {
          const json = await res.json().catch(() => null);
          bodyText = json ? JSON.stringify(json, null, 2) : "";
        } catch {
          bodyText = await res.text().catch(() => "");
        }
        addBot(`${type} added successfully!`);
       
      } else {
        let errText = "";
        try {
          const json = await res.json().catch(() => null);
          errText = json ? JSON.stringify(json) : await res.text();
        } catch (e) {
          errText = `Status ${res.status}`;
        }
        addBot(`Failed to save ${type}. Server said: ${errText}`);
      }
    } catch (e) {
      addBot(`Error connecting to ${type} API.`);
    }
  };

  // -------------------- reset --------------------
  const reset = () => {
    setMode(null);
    setFormData({});
    setStep(0);
    setMessages([{ sender: "bot", text: "Chat refreshed. Let's start over!", time: new Date() }]);
    setTimeout(() => {
      addBot("What would you like to do next? Customer, Supplier, Warehouse, Product, or Category?");
    }, 600);
  };

  // -------------------- UI --------------------
  return (
    <>
      {/* Floating open button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transform hover:scale-105 transition z-50"
          style={{
            background: "linear-gradient(135deg, rgba(255,115,0,1) 0%, rgba(255,196,0,1) 100%)",
            boxShadow: "0 8px 30px rgba(255,141,27,0.35)",
          }}
          aria-label="Open chat"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed z-[9999] flex flex-col border border-transparent transition-all duration-300 ${
            isFullScreen ? "inset-0 w-full h-full rounded-none" : "bottom-6 right-6 w-[96vw] h-[86vh] sm:w-[520px] sm:h-[640px] rounded-3xl"
          }`}
          style={{ backdropFilter: "saturate(140%) blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between px-5 py-3 rounded-t-3xl"
            style={{ background: "linear-gradient(90deg, rgba(255,120,0,1) 0%, rgba(255,175,45,1) 100%)", color: "white", boxShadow: "0 10px 30px rgba(255,120,0,0.18)" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold">Smart Assistant</div>
                <div className="text-xs opacity-90">Add customers, suppliers, products & more</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button title="Settings" onClick={() => setKeyModalOpen(true)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                <Settings className="w-5 h-5 text-white" />
              </button>

              <button title="Restart Chat" onClick={reset} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                <RotateCcw className="w-5 h-5 text-white" />
              </button>

              <button onClick={() => setIsFullScreen(!isFullScreen)} title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                {isFullScreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
              </button>

              <button onClick={() => setIsOpen(false)} title="Close chat" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: "linear-gradient(180deg, rgba(255,249,240,0.8) 0%, rgba(255,243,230,0.95) 100%)" }}>
            {messages.map((m, i) => {
              const isUser = m.sender === "user";
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"} items-end`}>
                  {!isUser && (
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,205,140,1) 0%, rgba(255,173,60,1) 100%)", boxShadow: "0 6px 18px rgba(255,160,50,0.18)" }}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}

                  <div className={`max-w-[78%] px-4 py-2 rounded-2xl shadow-md ${isUser ? "text-white" : "text-gray-900"}`} style={ isUser ? { background: "linear-gradient(90deg, rgba(255,120,0,1) 0%, rgba(255,175,45,1) 100%)", borderBottomRightRadius: 6 } : { background: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,175,45,0.08)", backdropFilter: "blur(6px)" } }>
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>

                    {m.buttons && m.buttons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.buttons.map((b, bi) => (
                          <button key={bi} onClick={() => handleSend(b)} className="px-3 py-1 rounded-full text-xs font-medium shadow-sm transition transform hover:-translate-y-0.5" style={{ background: "linear-gradient(90deg, rgba(255,160,50,1) 0%, rgba(255,200,80,1) 100%)", color: "white" }}>
                            {b}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] mt-2 opacity-70 text-right">
                      {m.time ? new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                  </div>

                  {isUser && (
                    <div className="flex-shrink-0 ml-3 mt-1">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,115,0,1) 0%, rgba(255,196,0,1) 100%)", boxShadow: "0 6px 18px rgba(255,140,25,0.18)" }}>
                        <Box className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* footer */}
          <div className="px-4 py-3 border-t" style={{ background: "linear-gradient(180deg, rgba(255,250,240,0.9) 0%, rgba(255,245,230,0.95) 100%)" }}>
            <div className="flex items-center gap-3">
              <input type="text" placeholder="Type your message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} className="flex-1 px-4 py-3 rounded-full focus:outline-none shadow-sm" style={{ border: "1px solid rgba(255,175,45,0.12)", background: "rgba(255,255,255,0.9)" }} />
              <button onClick={() => handleSend()} className="px-4 py-2 rounded-full flex items-center gap-2 font-semibold shadow-md transition transform hover:-translate-y-0.5" style={{ background: "linear-gradient(90deg, rgba(255,120,0,1) 0%, rgba(255,196,0,1) 100%)", color: "white" }} aria-label="Send message">
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
{/* 
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" />
                <span>Pro-tip: type "add product" or ask a general question (no trigger)</span>
              </div>
              <div className="flex items-center gap-3">
                <Archive className="w-4 h-4 text-gray-400" />
                <span>Local dev API: {API.product.replace(/\/products\/?$/, "/products/")}</span>
              </div>
            </div> */}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {keyModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="w-[92%] sm:w-[560px] bg-white rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-semibold">AI Provider Settings</div>
                <div className="text-sm text-gray-500">Select a provider and paste your API keys. Env variables take precedence.</div>
              </div>
              <button onClick={() => setKeyModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100" title="Close">
                <X />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Choose AI Provider</label>
              <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)} className="w-full border rounded-md px-3 py-2">
                <option value="openai">OpenAI (gpt-3.5-turbo)</option>
                <option value="gemini">Google Gemini (generativelanguage)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">OpenAI Key (env or local)</label>
                <input value={openaiKeyInput} onChange={(e) => setOpenaiKeyInput(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="sk-..." />
                <div className="mt-2 flex gap-2">
                  <button onClick={saveOpenAIKeyLocal} className="px-3 py-2 rounded-md bg-orange-500 text-white">Save OpenAI Key</button>
                  <button onClick={clearOpenAIKeyLocal} className="px-3 py-2 rounded-md border">Clear</button>
                </div>
                <div className="mt-2 text-xs text-gray-500">Env var <code>VITE_OPENAI_API_KEY</code> takes precedence.</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Gemini Key (env or local)</label>
                <input value={geminiKeyInput} onChange={(e) => setGeminiKeyInput(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="Paste your Gemini key..." />
                <div className="mt-2 flex gap-2">
                  <button onClick={saveGeminiKeyLocal} className="px-3 py-2 rounded-md bg-orange-500 text-white">Save Gemini Key</button>
                  <button onClick={clearGeminiKeyLocal} className="px-3 py-2 rounded-md border">Clear</button>
                </div>
                <div className="mt-2 text-xs text-gray-500">Env var <code>VITE_GEMINI_API_KEY</code> takes precedence.</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <input id="autofallback" type="checkbox" checked={autoFallbackAI} onChange={(e) => setAutoFallbackAI(e.target.checked)} className="mr-2" />
                <label htmlFor="autofallback">Automatically fallback to the other provider if selected provider fails</label>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setKeyModalOpen(false)} className="px-4 py-2 rounded-md border">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;