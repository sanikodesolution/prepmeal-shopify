# Prep Meal Theme: কনটেন্ট ইনপুট গাইড

এই গাইড দিয়ে ক্লায়েন্ট কোনো ডেভেলপার ছাড়াই পুরো সাইটের কনটেন্ট বসাতে পারবে।

## ১. কাজের নিয়ম (একবার পড়ুন)

থিমে প্রতিটি সেকশন **দুইভাবে** কনটেন্ট নেয়:

| মোড | কখন ব্যবহার করবেন | কোথায় এডিট করবেন |
|---|---|---|
| **Blocks মোড** | অল্প কনটেন্ট (৩–৬টি আইটেম) | Online Store → Customize → সেকশন সিলেক্ট করে |
| **Metaobject মোড** | বেশি কনটেন্ট (৭+ আইটেম), বারবার বদলায় | Content → Metaobjects → এন্ট্রি যোগ করুন |

**ক্রম:** সেকশনে Metaobject লিস্ট সিলেক্ট করা থাকলে সেটা দেখাবে। খালি থাকলে Blocks-এর কনটেন্ট দেখাবে।

**Metaobject মোড চালু করার ধাপ:**
1. Shopify Admin → **Content → Metaobjects** এ যান।
2. নিচের তালিকা থেকে Definition তৈরি করুন (নাম ও ফিল্ডের ধরন হুবহু মেলান)।
3. Entry যোগ করুন এবং **Active** স্ট্যাটাস দিন।
4. Customize এ গিয়ে সেকশনের **Content source** থেকে ওই Metaobject লিস্ট সিলেক্ট করুন।
5. Save দিন।

---

## ২. কনটেন্ট এরিয়া অনুযায়ী ইনপুট গাইড

### ২.১ Hero (হোমপেজের ব্যানার)

**মোড:** শুধু Customizer (Metaobject লাগবে না)

| ফিল্ড | ধরন | নির্দেশনা |
|---|---|---|
| Heading | Text | সর্বোচ্চ ৬০ অক্ষর। যেমন: "সারা সপ্তাহের খাবার, রেডি।" |
| Subheading | Text | সর্বোচ্চ ১২০ অক্ষর। একটা বাক্যে মূল সুবিধা |
| Background image | Image | ১৯২০×১০৮০ px, ৩০০ KB এর নিচে, খাবারের উপর টেক্সট পড়লে যেন পড়া যায় |
| Primary button label / link | Text / URL | লেবেল ২–৩ শব্দ ("প্ল্যান দেখুন")। লিংক: কালেকশন বা প্ল্যান পেজ |
| Secondary button | Text / URL | ঐচ্ছিক |

### ২.২ Meal Plans (প্ল্যান)

**Metaobject type:** `meal_plan`

| ফিল্ড | ধরন | নির্দেশনা |
|---|---|---|
| Name | Single line text | যেমন: "Lean 5-Day" |
| Image | File (image) | ৮০০×৮০০ px, বর্গাকার, সব প্ল্যানে একই স্টাইল |
| Short description | Single line text | সর্বোচ্চ ৮০ অক্ষর |
| Meals per week | Integer | যেমন: 10 |
| Calories per meal | Integer | গড় ক্যালরি |
| Protein / Carbs / Fat (g) | Integer (৩টি আলাদা ফিল্ড) | প্রতি মিলের গড় গ্রাম |
| Tags | List of single line text | যেমন: Keto, High Protein, Vegan |
| Linked product | Product reference | কার্টে যাবে যে প্রোডাক্টে |
| Badge | Single line text | ঐচ্ছিক: "Best Seller" |

**টিপ:** প্ল্যান ৩–৬টির মধ্যে রাখুন। বেশি হলে ফিল্টার ট্যাগ ব্যবহার করুন।

### ২.৩ Individual Meals (মেনু আইটেম)

**বিকল্প:** সাধারণত Shopify Product হিসেবেই রাখুন। নিচের Metafield যোগ করুন (Settings → Custom data → Products):

| Metafield | ধরন | ব্যবহার |
|---|---|---|
| `custom.calories` | Integer | কার্ডে ক্যালরি ব্যাজ |
| `custom.protein` / `carbs` / `fat` | Integer | নিউট্রিশন বার |
| `custom.ingredients` | Multi-line text | প্রোডাক্ট পেজের Ingredients ট্যাব |
| `custom.allergens` | List of text | অ্যালার্জেন আইকন (Gluten, Dairy, Nuts) |
| `custom.diet_tags` | List of text | ফিল্টার ও ব্যাজ |
| `custom.reheat_instructions` | Multi-line text | গরম করার নিয়ম |

**নির্দেশনা:** অ্যালার্জেন তথ্য সবসময় সঠিক ও আপ-টু-ডেট রাখুন। এটা গ্রাহকের স্বাস্থ্য-নিরাপত্তার বিষয়।

### ২.৪ How It Works (কীভাবে কাজ করে)

**Metaobject type:** `how_it_works_step`

| ফিল্ড | ধরন | নির্দেশনা |
|---|---|---|
| Step number | Integer | 1, 2, 3... (এই ক্রমেই দেখাবে) |
| Title | Single line text | ২–৪ শব্দ। যেমন: "প্ল্যান বাছুন" |
| Description | Multi-line text | ১–২ বাক্য, সর্বোচ্চ ১৫০ অক্ষর |
| Icon / Image | File | SVG বা ১২০×১২০ px PNG |

**টিপ:** ৩ বা ৪ ধাপ সবচেয়ে ভালো কাজ করে।

### ২.৫ FAQ

**Metaobject type:** `faq_item`

| ফিল্ড | ধরন | নির্দেশনা |
|---|---|---|
| Question | Single line text | গ্রাহক যেভাবে জিজ্ঞেস করে সেভাবে লিখুন |
| Answer | Rich text | সর্বোচ্চ ৩–৪ বাক্য, লিংক দেওয়া যাবে |
| Category | Single line text | Delivery, Meals, Billing, Account |
| Sort order | Integer | ছোট সংখ্যা আগে দেখাবে |

**অবশ্যই কভার করুন:** ডেলিভারির দিন, স্কিপ/পজ করার নিয়ম, ফ্রিজে কতদিন থাকে, অ্যালার্জেন, রিফান্ড।

### ২.৬ Testimonials

**Metaobject type:** `testimonial`

| ফিল্ড | ধরন | নির্দেশনা |
|---|---|---|
| Customer name | Single line text | প্রথম নাম + নামের প্রথম অক্ষর |
| Photo | File (image) | ২০০×২০০ px, বর্গাকার, ঐচ্ছিক |
| Review | Multi-line text | সর্বোচ্চ ২০০ অক্ষর |
| Rating | Rating | ৫ এর মধ্যে |
| Plan name | Single line text | ঐচ্ছিক |

**নিয়ম:** শুধু বাস্তব রিভিউ ব্যবহার করুন এবং গ্রাহকের অনুমতি নিন।

### ২.৭ Delivery Areas ও Schedule

**Metaobject type:** `delivery_zone`

| ফিল্ড | ধরন | নির্দেশনা |
|---|---|---|
| Area name | Single line text | যেমন: "Dhanmondi" |
| Postcodes / Areas | List of single line text | ম্যাচিং এর জন্য |
| Delivery days | List of single line text | যেমন: Sunday, Wednesday |
| Cut-off time | Single line text | যেমন: "Friday 8 PM" |
| Delivery fee | Money | ফ্রি হলে 0 |
| Minimum order | Money | ঐচ্ছিক |

### ২.৮ Pricing ও Subscription তথ্য

- মূল্য সবসময় **Product/Variant** থেকে আসবে, আলাদা করে টেক্সটে লিখবেন না (দাম বদলালে ভুল দেখাবে)।
- সাবস্ক্রিপশনের সুবিধা লিখতে Customizer এর "Benefits" ব্লক ব্যবহার করুন (প্রতি ব্লকে ১টি সুবিধা, সর্বোচ্চ ৮০ অক্ষর)।

### ২.৯ Announcement Bar ও Footer

| এরিয়া | কোথায় | নির্দেশনা |
|---|---|---|
| Announcement bar | Customize → Header group | ১টি বাক্য, সর্বোচ্চ ৮০ অক্ষর। যেমন: "প্রথম অর্ডারে ১০% ছাড়" |
| Footer links | Content → Menus | Menu এডিট করলে ফুটার আপডেট হবে |
| Social links | Theme settings → Social media | পুরো URL দিন (https://...) |
| Contact info | Theme settings → Contact | ফোন, ইমেইল, ঠিকানা |

---

## ৩. ছবির সাধারণ নিয়ম

| ব্যবহার | সাইজ | ফরম্যাট |
|---|---|---|
| Hero | ১৯২০×১০৮০ | JPG / WebP |
| প্ল্যান / মিল কার্ড | ৮০০×৮০০ | JPG / WebP |
| আইকন | SVG বা ১২০×১২০ | SVG / PNG |
| প্রোফাইল ফটো | ২০০×২০০ | JPG |

- প্রতিটি ছবিতে **Alt text** দিন (যেমন: "গ্রিলড চিকেন ও ব্রকলি মিল বক্স")।
- খাবারের ছবির আলো ও ব্যাকগ্রাউন্ড একই ধরনের রাখুন।

## ৪. প্রকাশের আগে চেকলিস্ট

- [ ] সব Metaobject এন্ট্রি **Active**
- [ ] প্রতিটি সেকশনে সঠিক Content source সিলেক্ট করা
- [ ] সব প্ল্যান ও মিলের নিউট্রিশন এবং অ্যালার্জেন তথ্য যাচাই করা
- [ ] মোবাইল প্রিভিউতে প্রতিটি পেজ দেখা
- [ ] সব বাটনের লিংক টেস্ট করা
- [ ] ডেলিভারি জোন ও কাট-অফ টাইম সঠিক
- [ ] সব ছবিতে Alt text আছে

## ৫. সাধারণ সমস্যা ও সমাধান

| সমস্যা | কারণ | সমাধান |
|---|---|---|
| সেকশনে কনটেন্ট আসছে না | Metaobject এন্ট্রি Draft অবস্থায় | স্ট্যাটাস Active করুন |
| ভুল ক্রমে দেখাচ্ছে | Sort order নেই | Sort order ফিল্ডে সংখ্যা দিন |
| ছবি কেটে যাচ্ছে | ভুল অনুপাত | নির্দেশিত সাইজে আপলোড করুন |
| Metaobject লিস্ট সিলেক্ট করা যাচ্ছে না | Definition এর type নাম মেলেনি | উপরের type নাম হুবহু ব্যবহার করুন |
| পুরোনো কনটেন্ট দেখাচ্ছে | ব্রাউজার ক্যাশ | হার্ড রিফ্রেশ করুন |
