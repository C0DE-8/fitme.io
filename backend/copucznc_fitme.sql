-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 26, 2026 at 06:35 PM
-- Server version: 11.4.10-MariaDB-cll-lve
-- PHP Version: 8.3.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `copucznc_fitme`
--

-- --------------------------------------------------------

--
-- Table structure for table `bank_accounts`
--

CREATE TABLE `bank_accounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `bank_name` varchar(100) NOT NULL,
  `account_name` varchar(120) NOT NULL,
  `account_number` varchar(64) NOT NULL,
  `account_logo` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bank_accounts`
--

INSERT INTO `bank_accounts` (`id`, `bank_name`, `account_name`, `account_number`, `account_logo`, `created_at`) VALUES
(2, 'moniepoint', 'Copupbid Limited', '7065785436', '1779811287094_1000526459.png', '2025-08-09 15:21:04');

-- --------------------------------------------------------

--
-- Table structure for table `chat_history`
--

CREATE TABLE `chat_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text NOT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `replied` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_history`
--

INSERT INTO `chat_history` (`id`, `user_id`, `role`, `content`, `session_id`, `created_at`, `replied`) VALUES
(15, 3, 'user', 'anytning', NULL, '2025-09-09 18:23:19', 0),
(16, 3, 'assistant', 'Hello, sam! How can I assist you today? Are you looking for meal suggestions or budgeting tips?', NULL, '2025-09-09 18:23:19', 0),
(17, 3, 'user', 'What can I cook for dinner?', NULL, '2025-09-09 18:23:42', 0),
(18, 3, 'assistant', 'For dinner, I recommend the **Special Fried Rice**, which is a delicious Nigerian dish. Here\'s a quick overview:\n\n**Special Fried Rice** — est. cost: ₦900\n- Ingredients: \n  - Rice: ₦300\n  - Chicken: ₦500\n  - Carrots: ₦100\n\nDo you have these ingredients at home, or would you like additional suggestions? If you need to pick up any missing ingredients, I can also help with that!', NULL, '2025-09-09 18:23:42', 0),
(19, 3, 'user', 'What can I cook for dinner?', NULL, '2025-09-09 18:26:22', 1),
(20, 3, 'assistant', 'Hi again, sam! For dinner, how about making **Eba Supreme**? It\'s a simple and satisfying option.\n\n**Eba Supreme** — est. cost: ₦300\n- Ingredients: \n  - Gari: ₦300\n  - Water: Free\n\nThis dish is quick to prepare and quite filling. Do you have gari at home? If not, I can suggest cheap alternatives or other meal ideas based on what you might have!', NULL, '2025-09-09 18:26:22', 1),
(21, 3, 'user', 'food i can cook', NULL, '2025-09-09 18:48:11', 1),
(22, 3, 'assistant', 'Sure, sam! Here are some Nigerian dishes you can cook based on the ingredients you might already have:\n\n1. **Eba Supreme**\n   - **Ingredients**: Gari, Water  \n   - **Cost**: ₦300  \n   - **Preparation**: \n     1. Boil water in a pot.\n     2. Gradually add gari to the hot water, stirring continuously to prevent lumps.\n     3. Keep stirring until smooth and elastic.\n     4. Serve hot with your choice of soup or stew.\n\n2. **Special Fried Rice** (if you have the ingredients)\n   - **Ingredients**: Rice, Chicken, Carrots  \n   - **Cost**: ₦900 (if you need to buy everything) \n   - **Preparation** - (not provided here, but if you have the ingredients, I can guide you on how to make it!)\n\nLet me know if you have specific ingredients on hand, and I can tailor my suggestions more accurately!', NULL, '2025-09-09 18:48:11', 1),
(23, 3, 'user', 'ok', NULL, '2025-09-09 18:48:54', 1),
(24, 3, 'assistant', 'Great! Please let me know what ingredients you have at home, and I can suggest a delicious meal for you to cook!', NULL, '2025-09-09 18:48:54', 1),
(25, 3, 'user', 'how can i make it', NULL, '2025-09-09 18:49:21', 1),
(26, 3, 'assistant', 'Let\'s go with **Eba Supreme** since it\'s simple and quick to prepare. Here’s a step-by-step guide for making it:\n\n### How to Prepare Eba Supreme\n\n**Ingredients**:\n- Gari: 300g\n- Water: Enough for mixing\n\n**Preparation Steps**:\n\n1. **Boil Water**: Start by boiling about 2-3 cups of water in a pot. The amount of water can vary depending on how much eba you want to make, but make sure to have enough to mix with the gari.\n\n2. **Add Gari**: Once the water is boiling, reduce the heat to medium. Gradually sprinkle the gari into the boiling water while stirring continuously using a wooden spatula or a strong spoon to prevent lumps from forming.\n\n3. **Mix Until Smooth**: Keep stirring until the gari absorbs the water and the mixture becomes smooth and elastic. It should be thick but pliable.\n\n4. **Adjust Consistency**: If it\'s too thick, you can add a little more hot water and continue stirring until you reach your desired consistency.\n\n5. **Serve**: Once ready, shape the eba into round balls and serve it hot with your favorite soup or stew.\n\nThis should make for a lovely dinner! If you have any soup or stew in mind to pair with the eba, let me know, and I can help with additional suggestions!', NULL, '2025-09-09 18:49:21', 1),
(27, 3, 'user', 'hello what your name', NULL, '2025-09-09 19:33:39', 1),
(28, 3, 'assistant', 'Hello, sam! I\'m Fitme.io AI, your meal and budgeting assistant. How can I help you today? If you need meal suggestions or budgeting tips, feel free to ask!', NULL, '2025-09-09 19:33:39', 1),
(29, 3, 'user', 'ok try me', NULL, '2025-09-09 19:34:06', 1),
(30, 3, 'assistant', 'Alright, sam! Let\'s see what meal we can create based on common ingredients. Here are a few options based on what you might have:\n\n1. **Eba Supreme** (if you have gari and water)\n2. **Jollof Deluxe** (if you have rice, tomato puree, pepper mix, chicken stock, and vegetables)\n3. **Special Fried Rice** (if you have rice, chicken, and carrots)\n\nCan you tell me which ingredients you have? This way, I can recommend the best dish for you!', NULL, '2025-09-09 19:34:06', 1),
(31, 3, 'user', 'give me any one you like', NULL, '2025-09-09 19:34:47', 1),
(32, 3, 'assistant', 'Alright, sam! Let\'s go with **Eba Supreme** since it’s simple, quick to prepare, and satisfying.\n\n### **Eba Supreme**\n- **Ingredients**:\n  - Gari: ₦300\n  - Water: (Free if you have tap water)\n\n### **Preparation**:\n1. **Boil Water**: Start by boiling about 2 cups of water in a pot.\n2. **Add Gari**: Once the water is boiling, gradually add gari while stirring continuously. You can adjust the amount of gari based on how much eba you want to make.\n3. **Stir Until Smooth**: Keep stirring until the mixture is smooth, yielding an elastic consistency. This may take a few minutes.\n4. **Serve**: Form the eba into a ball or your desired shape and serve hot with your choice of soup or stew (such as egusi soup, okra soup, or any other you have). \n\nEnjoy your meal! Let me know if you need any help with serving suggestions or if there’s anything else you’d like!', NULL, '2025-09-09 19:34:47', 1),
(33, 3, 'user', 'Show my storage items', NULL, '2025-09-09 19:35:09', 1),
(34, 3, 'assistant', 'It looks like you don\'t currently have any storage items saved, sam. If you\'d like, you can tell me the ingredients you have at home right now, and I can help you come up with meal ideas!', NULL, '2025-09-09 19:35:09', 1),
(35, 3, 'user', 'Suggest a Nigerian meal', NULL, '2025-09-09 19:35:20', 1),
(36, 3, 'assistant', 'Sure, sam! Based on the ingredients we\'ve discussed, I suggest making **Eba Supreme**. It’s simple, delicious, and satisfying!\n\n### Eba Supreme\n**Ingredients**:\n- Gari: ₦300\n- Water: Free\n\n### Preparation:\n1. **Boil Water**: In a pot, bring the desired amount of water to a boil.\n2. **Add Gari**: Gradually sprinkle gari into the boiling water while stirring continuously to avoid lumps.\n3. **Mix Until Smooth**: Keep stirring until the mixture is smooth and stretchy.\n4. **Serve Hot**: Shape the eba into a ball or pieces and serve it with your choice of soup or stew.\n\nYou can enjoy it with a vegetable soup, egusi soup, or any stew you like! Do you have any soup or stew to pair with it? If you need suggestions about what to pair with it, let me know!', NULL, '2025-09-09 19:35:20', 1),
(37, 3, 'user', 'how do i make the eba supreme', NULL, '2025-09-09 19:35:49', 1),
(38, 3, 'assistant', 'Sure, sam! Here’s a step-by-step guide to making **Eba Supreme**:\n\n### Ingredients:\n- Gari: 300g\n- Water: 0 (you will need to boil some)\n\n### Preparation Instructions:\n1. **Boil Water**: \n   - Start by boiling about 1-2 cups of water in a pot. The amount of water will vary based on how much eba you want to make, but ensure you have enough to mix with the gari to get the right consistency.\n\n2. **Add Gari**: \n   - Once the water starts boiling, reduce the heat slightly. Gradually add the gari into the boiling water while stirring continuously. This helps to prevent lumps from forming.\n\n3. **Stir Until Smooth**: \n   - Continue stirring vigorously with a wooden spatula or spoon. You will notice that the gari starts to thicken and become smooth. Keep mixing until the eba is well combined and has a stretchy consistency.\n\n4. **Check Consistency**: \n   - If the eba is too stiff, you can add a little more hot water and continue stirring until you achieve your desired consistency.\n\n5. **Serve**: \n   - Once it\'s smooth and ready, mold the eba into small balls or serve it in a bowl. You can enjoy it hot with your favorite soup or stew.\n\nFeel free to let me know if you need any recommendations for accompanying soups or stews! Enjoy your meal!', NULL, '2025-09-09 19:35:49', 1),
(39, 3, 'user', 'can you say this in a fun way', NULL, '2025-09-09 19:36:50', 1),
(40, 3, 'assistant', 'Absolutely, sam! 🎉\n\nSo, what’s cooking in your kitchen? 🍳✨ Share your ingredient stash with me, and let’s whip up some Nigerian magic together! Whether it\'s Eba Supreme or a sizzlin\' Special Fried Rice, I\'m here to turn your dinner into a feast! 🍚🍗🥕 What do you have on hand? Let’s get this culinary party started! 🎈', NULL, '2025-09-09 19:36:50', 1),
(41, 3, 'user', 'ok thanks', NULL, '2025-09-09 19:37:08', 1),
(42, 3, 'assistant', 'You\'re welcome, sam! If you need any further assistance or have questions about cooking or meal ideas, feel free to ask. Enjoy your cooking!', NULL, '2025-09-09 19:37:08', 1),
(43, 3, 'user', 'use emoils to chat me', NULL, '2025-09-09 19:37:26', 1),
(44, 3, 'assistant', 'Sure thing, sam! 😊 Just let me know what ingredients you have, and I’ll help you whip up something tasty! 🍽️✨', NULL, '2025-09-09 19:37:26', 1),
(45, 3, 'user', 'what next', NULL, '2025-09-09 19:37:36', 1),
(46, 3, 'assistant', 'If you\'re interested in trying one of the dishes, you can choose between:\n\n1. **Eba Supreme** (quick and easy)\n2. **Special Fried Rice** (if you have chicken and carrots)\n\nJust let me know which one you\'d like to prepare, or if you have particular ingredients on hand, I can help you come up with a meal plan based on what you have. What\'s your preference?', NULL, '2025-09-09 19:37:36', 1),
(47, 3, 'user', 'send me a like to google', NULL, '2025-09-09 19:37:50', 1),
(48, 3, 'assistant', 'I can\'t browse the internet or send links directly, but you can easily access Google by typing \"www.google.com\" into your web browser\'s address bar. If you need help with anything else, feel free to ask, sam!', NULL, '2025-09-09 19:37:50', 1),
(49, 3, 'user', 'school', NULL, '2025-09-09 19:38:10', 1),
(50, 3, 'assistant', 'It seems you might be busy or in school, sam! If you\'re looking for quick meal ideas that you can prepare after classes, I can suggest simple recipes or snacks. Just let me know what you need!', NULL, '2025-09-09 19:38:10', 1),
(51, 3, 'user', 'yes that will be great', NULL, '2025-09-09 19:38:28', 1),
(52, 3, 'assistant', 'Awesome! Please share the ingredients you currently have at home, and I\'ll suggest a tasty meal you can prepare for dinner!', NULL, '2025-09-09 19:38:28', 1),
(53, 3, 'user', 'how can i make it', NULL, '2025-09-11 14:18:48', 1),
(54, 3, 'assistant', 'Great choice, sam! Here’s how to make **Eba Supreme** step-by-step:\n\n### Ingredients:\n- Gari (300g)\n- Water (as needed)\n\n### Instructions:\n1. **Boil Water**: Start by boiling some water in a pot. You will need enough to mix with the gari to achieve your desired consistency.\n\n2. **Mix Gari**: Once the water is boiling, take it off the heat and gradually pour the gari into the pot while stirring continuously. \n\n3. **Stir until Smooth**: Keep stirring the mixture until it becomes smooth and elastic. If it\'s too thick, you can add a little more hot water to loosen it up.\n\n4. **Shape and Serve**: Once it reaches the desired consistency, mold it into your preferred shape or serve directly from the pot.\n\n5. **Enjoy with Soup/Stew**: Serve your Eba hot with your favorite soup or stew of your choice!\n\n### Cost:\n- Gari (300g): Approx. ₦150\n\nIf you have soup or stew to go with your Eba, fantastic! If not, let me know, and I can suggest a simple recipe! 🍲', NULL, '2025-09-11 14:18:48', 1),
(55, 3, 'user', 'hello i need to eat rice', '55', '2025-09-11 14:31:05', 1),
(56, 3, 'assistant', 'Hey sam 👋\n\nSince you\'re interested in rice, let\'s go for **Special Fried Rice**! Here’s how you can make it, along with what you might need to get:\n\n### Ingredients:\n- Rice (300g)\n- Chicken (500g)\n- Carrots (100g)\n- **Optional**: Any spices or seasoning you like (e.g., salt, pepper, curry powder)\n\n### Instructions:\n1. **Cook the Rice**: Rinse the rice under cold water until the water runs clear. Boil water in a pot, add the rice, and cook until tender. Drain and set aside.\n\n2. **Prepare the Chicken**: Cut the chicken into small pieces. Season with salt and any spices you like. Cook in a pan until golden brown and fully cooked.\n\n3. **Chop Carrots**: While the chicken is cooking, peel and chop the carrots into small cubes.\n\n4. **Combine Ingredients**: In the same pan with the chicken, add the chopped carrots and stir-fry for a few minutes until they soften.\n\n5. **Add Rice**: Add the cooked rice to the pan. Stir everything together, ensuring the rice is well mixed with the chicken and carrots.\n\n6. **Season to Taste**: Adjust seasoning as needed, adding more salt or spices according to your taste.\n\n7. **Serve**: Once everything is heated through, serve your Special Fried Rice hot!\n\n### Estimated Cost:\n- Rice (300g): Approx. ₦150\n- Chicken (500g): Approx. ₦800\n- Carrots (100g): Approx. ₦50\n\n### Total: ₦1000 (approx.)\n\nLet me know if you need any more help or if you want to adjust the recipe! 🍚', '55', '2025-09-11 14:31:05', 1),
(57, 3, 'user', 'hello', '57', '2025-09-11 14:38:05', 1),
(58, 3, 'assistant', 'Hey sam 👋\n\nIf you\'re craving rice, how about making **Jollof Deluxe**? Here’s how you can prepare it!\n\n### Ingredients:\n- Rice (1200g)\n- Tomato puree (800g)\n- Pepper mix (500g)\n- Chicken stock (900g)\n- Vegetables (400g)\n- **Optional**: Any spices or seasoning you like (e.g., salt, curry powder)\n\n### Instructions:\n1. **Prepare Rice**: Rinse the rice under cold water. Set aside.\n\n2. **Make Tomato Base**: In a pot, pour in the tomato puree and add the pepper mix. Cook on medium heat until it thickens, stirring occasionally.\n\n3. **Add Chicken Stock**: Pour in the chicken stock and bring the mixture to a boil. Season with salt and any spices you prefer.\n\n4. **Combine Rice**: Add the rinsed rice to the pot and stir well to combine. Ensure the rice is submerged in the sauce.\n\n5. **Simmer**: Cover the pot and reduce the heat to low. Let it simmer for about 20-30 minutes, or until the rice is cooked and has absorbed the sauce.\n\n6. **Add Vegetables**: Once the rice is almost done, stir in the vegetables and cook for an additional 5 minutes.\n\n7. **Serve**: Fluff the rice with a fork and serve hot!\n\n### Estimated Cost:\n- Rice (1200g): Approx. ₦600\n- Tomato puree (800g): Approx. ₦300\n- Pepper mix (500g): Approx. ₦200\n- Chicken stock (900g): Approx. ₦400\n- Vegetables (400g): Approx. ₦200\n\n### Total: ₦1700 (approx.)\n\nLet me know if you need any adjustments or more help! 🍚🍅', '57', '2025-09-11 14:38:05', 1),
(59, 3, 'user', 'can you give me the food in list so i can understand better', '59', '2025-09-11 14:38:29', 1),
(60, 3, 'assistant', 'Of course, sam! Here’s a clear list for making **Jollof Deluxe**:\n\n### Jollof Deluxe Ingredients:\n- **Rice**: 1200g\n- **Tomato Puree**: 800g\n- **Pepper Mix**: 500g\n- **Chicken Stock**: 900g\n- **Vegetables**: 400g\n- **Optional Spices/Seasoning**: \n  - Salt\n  - Curry powder (or any other spices you prefer)\n\n### Cooking Instructions:\n1. **Prepare Rice**: Rinse the rice under cold water and set aside.\n2. **Make Tomato Base**: In a pot, cook the tomato puree and pepper mix on medium heat until thickened.\n3. **Add Chicken Stock**: Pour in the chicken stock, bring to a boil, and season with salt and spices.\n4. **Combine Rice**: Add the rinsed rice, ensuring it’s submerged in the sauce.\n5. **Simmer**: Cover and simmer on low heat for 20-30 minutes until rice is cooked.\n6. **Add Vegetables**: Stir in the vegetables and cook for an additional 5 minutes.\n7. **Serve**: Fluff the rice and serve hot!\n\n### Estimated Cost:\n- **Rice**: ₦600\n- **Tomato Puree**: ₦300\n- **Pepper Mix**: ₦200\n- **Chicken Stock**: ₦400\n- **Vegetables**: ₦200\n\n### **Total Cost**: ₦1700 (approx.)\n\nLet me know if you need more help or adjustments! 🍚🍅', '59', '2025-09-11 14:38:29', 1),
(61, 3, 'user', 'Show my food storage', '61', '2025-09-11 14:43:30', 1),
(62, 3, 'assistant', 'Hey sam 👋\n\nIt looks like you currently have **no storage items** found. If you have any ingredients at home, please share them, and I can help you create a meal plan or suggest recipes!\n\n### Jollof Deluxe Ingredients List:\nHere’s a clear list of what you need to make **Jollof Deluxe**:\n\n1. **Rice**: 1200g\n2. **Tomato Puree**: 800g\n3. **Pepper Mix**: 500g\n4. **Chicken Stock**: 900g\n5. **Vegetables**: 400g\n6. **Optional Spices/Seasoning**:\n   - Salt\n   - Curry powder (or any other spices you prefer)\n\n### Cooking Instructions:\n1. **Prepare Rice**: Rinse the rice under cold water and set aside.\n2. **Make Tomato Base**: Cook the tomato puree and pepper mix on medium heat until thickened.\n3. **Add Chicken Stock**: Pour in the chicken stock, bring to a boil, and season with salt and spices.\n4. **Combine Rice**: Add the rinsed rice, ensuring it’s submerged in the sauce.\n5. **Simmer**: Cover and simmer on low heat for 20-30 minutes until rice is cooked.\n6. **Add Vegetables**: Stir in the vegetables and cook for an additional 5 minutes.\n7. **Serve**: Fluff the rice and serve hot!\n\n### Estimated Cost:\n- **Total Cost**: ₦1700 (approx.)\n\nLet me know if you need anything else! 🍚', '61', '2025-09-11 14:43:30', 1);

-- --------------------------------------------------------

--
-- Table structure for table `foods`
--

CREATE TABLE `foods` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `package` varchar(100) NOT NULL,
  `ingredients` text NOT NULL,
  `estimated_cost` int(11) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `type` enum('rice','swallow','junks') NOT NULL DEFAULT 'rice',
  `prepared` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `foods`
--

INSERT INTO `foods` (`id`, `name`, `package`, `ingredients`, `estimated_cost`, `image`, `created_at`, `type`, `prepared`) VALUES
(11, 'Akara', 'Normal', 'Beans-400, Pepper-300, Oil-500, Onion-300, Salt-0', 1500, 'food-1779807177998-717339478.jpg', '2026-05-26 14:52:58', 'junks', 'To make Akara, start by soaking two cups of beans in water for five minutes. Rub the beans between your hands to peel off the skins, and rinse them until they are clean. Next, blend the beans with one pepper, half an onion, and a tiny bit of water to keep the batter very thick. Pour the smooth mix into a bowl and stir it fast with a spoon for five minutes to trap air, which makes it fluffy. Right before cooking, stir in some salt, a seasoning cube, and the rest of the chopped onion. Finally, scoop the mix into hot oil and fry until both sides are golden brown'),
(12, 'Beans', 'Normal', 'Beans-800, Oil-200, Maggi-100, Salt-0, Pepper-200, Onion-200', 1500, 'food-1779807653121-576645060.jpg', '2026-05-26 15:00:53', 'junks', 'To cook delicious Nigerian porridge beans, start by picking out any dirt from two cups of brown or honey beans, then rinse them well. Put the beans in a pot, cover them with plenty of water, and boil until they are completely soft and tender, adding more water along the way if needed. Once the beans are soft, add a chopped onion, blended pepper, a big spoonful of palm oil, two seasoned cubes, and a little salt to taste. You can also throw in diced plantains, sweet potatoes, or smoked fish at this point if you like. Stir everything together, lower the heat, and let it simmer for about 10 minutes until the palm oil cooks into the beans and the sauce becomes thick and creamy'),
(13, 'Pepper soup', 'Normal ', 'Pepper-300, Salt-0, Maggi-100, Fish-1500, Onion-200', 2100, 'food-1779808036330-230073664.jpg', '2026-05-26 15:07:16', 'swallow', 'To cook pepper soup, wash your choice of meat (goat, chicken, or beef) and boil it with chopped onions, seasoning cubes, and salt until tender. Add more water for the broth, then stir in pepper soup spice, and blended fresh peppers. Let it boil rapidly for 10 minutes so the flavors mix, adjust the salt, and throw in some fresh scent leaves. Simmer for two minutes, and it is ready.'),
(14, 'Fried Rice ', 'Normal ', 'Rice-1500, Maggi-100, Onion-400, Curry-200, Thyme-200, Chicken-4000, Green peas-800, Vegetable oil-350', 7550, 'food-1779808372488-618159478.jpg', '2026-05-26 15:12:52', 'rice', 'To make fried rice, first wash and season your chicken or turkey with onions, seasoning cubes, garlic, ginger, curry, thyme, and salt. Boil the meat until tender, then remove it to fry or roast, saving the rich meat stock for later.\r\nNext, parboil your washed rice in the meat stock with a little extra water and curry powder until it is nearly cooked but still firm, then set it aside. In a large pan, heat a little oil or butter to stir-fry chopped carrots, green beans, green peas, and onions for a few minutes, seasoning them lightly with a stock cube. Finally, add the parboiled rice to the veggies in small batches, stirring constantly on high heat for a few minutes until everything is well mixed and fried through.'),
(15, 'Yam Porridge', 'Normal', 'Yam-900, Oil-200, Maggi-50, Salt-0, Scent leaf-300', 1450, 'food-1779809115649-621226747.jpg', '2026-05-26 15:25:15', 'junks', 'To make yam porridge , peel a tuber of yam, cut it into bite-sized cubes, wash them thoroughly, and put them in a pot. Add enough water to just cover the yams, then add chopped onions, blended habanero pepper, two spoonfuls of palm oil, seasoning cubes, and salt. Cover the pot and boil on medium heat for about 15 to 20 minutes until the yams are completely soft. Once tender, use a wooden spoon to mash a few of the yam chunks right inside the pot to thicken the sauce into a rich porridge. Finally, stir in some fresh scent leaves or spinach, let it simmer for two minutes, and it is ready to serve.');

-- --------------------------------------------------------

--
-- Table structure for table `food_feed_comments`
--

CREATE TABLE `food_feed_comments` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `body` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `food_feed_comment_reactions`
--

CREATE TABLE `food_feed_comment_reactions` (
  `id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `comment_author_user_id` int(11) NOT NULL,
  `reactor_user_id` int(11) NOT NULL,
  `reaction_type` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `food_feed_follows`
--

CREATE TABLE `food_feed_follows` (
  `follower_user_id` int(11) NOT NULL,
  `following_user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `food_feed_follows`
--

INSERT INTO `food_feed_follows` (`follower_user_id`, `following_user_id`, `created_at`) VALUES
(10, 5, '2026-05-21 18:27:38'),
(13, 3, '2026-05-26 16:18:37'),
(14, 3, '2026-05-26 16:28:20'),
(14, 13, '2026-05-26 16:27:57');

-- --------------------------------------------------------

--
-- Table structure for table `food_feed_posts`
--

CREATE TABLE `food_feed_posts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `meal_name` varchar(140) DEFAULT NULL,
  `caption` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `food_feed_posts`
--

INSERT INTO `food_feed_posts` (`id`, `user_id`, `meal_name`, `caption`, `image`, `created_at`, `expires_at`) VALUES
(5, 13, 'Jollof 😋', 'My view', 'food-1779811981611-859607721.jpg', '2026-05-26 16:13:01', '2026-05-27 12:13:01');

-- --------------------------------------------------------

--
-- Table structure for table `food_feed_reactions`
--

CREATE TABLE `food_feed_reactions` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `post_author_user_id` int(11) NOT NULL,
  `reactor_user_id` int(11) NOT NULL,
  `reaction_type` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `food_feed_reactions`
--

INSERT INTO `food_feed_reactions` (`id`, `post_id`, `post_author_user_id`, `reactor_user_id`, `reaction_type`, `created_at`, `updated_at`) VALUES
(1, 1, 5, 5, 'love', '2026-05-21 18:26:31', '2026-05-21 18:27:14'),
(9, 1, 5, 10, 'like', '2026-05-21 18:27:29', '2026-05-21 18:27:29'),
(11, 5, 13, 13, 'fire', '2026-05-26 16:13:19', '2026-05-26 16:13:19'),
(12, 5, 13, 14, 'like', '2026-05-26 16:27:54', '2026-05-26 16:27:54');

-- --------------------------------------------------------

--
-- Table structure for table `message_bot_messages`
--

CREATE TABLE `message_bot_messages` (
  `id` int(11) NOT NULL,
  `food_type` enum('rice','swallow','junks') NOT NULL,
  `situation` enum('perfect','close','none') NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `message_bot_messages`
--

INSERT INTO `message_bot_messages` (`id`, `food_type`, `situation`, `message`, `created_at`, `updated_at`) VALUES
(1, 'rice', 'perfect', 'Wow! You have all the ingredients to cook a delicious rice meal! Bon appétit! 🍚🔥', '2025-08-02 15:18:43', '2025-08-02 15:18:43'),
(2, 'rice', 'perfect', 'Rice, rice baby! You\'re all set to cook a delicious rice meal!🍚🔥', '2025-08-02 15:19:18', '2025-08-02 15:19:18'),
(3, 'rice', 'close', 'Almost there! Just a little more to make that rice dish happen.', '2025-08-02 15:19:52', '2025-08-02 15:19:52'),
(4, 'rice', 'none', 'Rice dreams deferred... let\'s try again soon!', '2025-08-02 15:20:17', '2025-08-02 15:20:17');

-- --------------------------------------------------------

--
-- Table structure for table `otps`
--

CREATE TABLE `otps` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `otps`
--

INSERT INTO `otps` (`id`, `user_id`, `otp_code`, `expires_at`, `created_at`) VALUES
(9, 11, '215163', '2026-04-09 03:36:06', '2026-04-09 10:26:06');

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `id` int(11) NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `plan_name`, `price`, `created_at`) VALUES
(1, 'Premium Plus', 1000.00, '2025-07-28 15:21:02');

-- --------------------------------------------------------

--
-- Table structure for table `storage_friend_suggestions`
--

CREATE TABLE `storage_friend_suggestions` (
  `id` int(11) NOT NULL,
  `owner_user_id` int(11) NOT NULL,
  `share_id` varchar(255) NOT NULL,
  `food_id` int(11) NOT NULL,
  `food_type` varchar(50) NOT NULL,
  `food_name` varchar(255) NOT NULL,
  `suggested_by_name` varchar(255) NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `storage_friend_suggestions`
--

INSERT INTO `storage_friend_suggestions` (`id`, `owner_user_id`, `share_id`, `food_id`, `food_type`, `food_name`, `suggested_by_name`, `note`, `created_at`) VALUES
(1, 5, '0bde0646ff97d10b2e301cde6e0bf7d5', 10, 'swallow', 'Eba ', 'sam', 'hello why no tae eba', '2026-05-21 18:04:02'),
(2, 5, '0bde0646ff97d10b2e301cde6e0bf7d5', 1, 'rice', 'Special Fried Rice', 'potato', 'well i see that you are hunter', '2026-05-21 18:11:43'),
(3, 14, 'a8b3bf272e939a0bfffb078c372c2660', 15, 'junks', 'Yam Porridge', 'Potato', 'Just take this', '2026-05-26 16:31:26');

-- --------------------------------------------------------

--
-- Table structure for table `storage_items`
--

CREATE TABLE `storage_items` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `storage_items`
--

INSERT INTO `storage_items` (`id`, `name`, `image`) VALUES
(1, 'Rice', NULL),
(2, 'Beans', 'food-1779384212148-192417166.jpg'),
(3, 'Yam', 'food-1779809783014-148901159.jpg'),
(4, 'Garri', 'food-1779810099621-301638951.jpg'),
(5, 'Spaghetti', NULL),
(6, 'Tomato', 'food-1779810465042-811648394.jpg'),
(7, 'Oil', 'food-1779810040735-895330572.jpg'),
(8, 'Onion', 'food-1779810235888-929436729.jpg'),
(9, 'Salt', NULL),
(10, 'Pepper', NULL),
(11, 'Fish', 'food-1779833902313-702826604.jpeg'),
(12, 'Maggi', 'food-1779809899621-207379306.jpg'),
(13, 'Vegetable oil', 'food-1779834140386-167026851.jpeg'),
(14, 'Curry', 'food-1779809714105-693157176.png'),
(15, 'Garlic', 'food-1779834007988-44966775.jpeg'),
(16, 'Thyme', NULL),
(17, 'Chicken', 'food-1779809438937-481514528.jpg'),
(18, 'Beaf', 'food-1779834335372-368833505.jpeg'),
(19, 'Turkey', 'food-1779834196786-148717912.jpeg'),
(20, 'Green peas', 'food-1779834081262-968614415.jpeg'),
(21, 'Carrot', 'food-1779809359907-796210227.jpg'),
(22, 'Crayfish', 'food-1779809580274-910339857.jpg'),
(24, 'Scent leaf', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `storage_shares`
--

CREATE TABLE `storage_shares` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `share_id` varchar(64) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `storage_shares`
--

INSERT INTO `storage_shares` (`id`, `user_id`, `share_id`, `is_enabled`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 3, '160f381453488ffb623062e76c9f4098', 1, NULL, '2025-08-12 17:59:01', '2025-08-12 19:26:24'),
(19, 5, '0bde0646ff97d10b2e301cde6e0bf7d5', 1, NULL, '2026-04-09 01:14:08', '2026-05-21 17:41:03'),
(25, 12, 'c48e87cb28a06f2ffa26aeb407753c2b', 1, NULL, '2026-04-09 10:32:46', '2026-04-09 10:32:46'),
(87, 14, 'a8b3bf272e939a0bfffb078c372c2660', 1, NULL, '2026-05-26 16:30:37', '2026-05-26 16:30:37');

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `status` enum('pending','active','inactive','cancelled') NOT NULL DEFAULT 'pending',
  `start_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_proof` varchar(255) DEFAULT NULL,
  `payer_bank_name` varchar(150) DEFAULT NULL,
  `payer_account_name` varchar(150) DEFAULT NULL,
  `payer_account_number` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `user_id`, `plan_name`, `status`, `start_date`, `expiry_date`, `created_at`, `payment_proof`, `payer_bank_name`, `payer_account_name`, `payer_account_number`) VALUES
(1, 3, 'Premium Plus', 'cancelled', '2025-07-28', '2025-09-30', '2025-07-28 15:55:48', 'payment_proof-1753718148069-461763618.jpeg', NULL, NULL, NULL),
(4, 3, 'Premium Plus', 'cancelled', '2025-08-09', '2025-09-08', '2026-08-09 16:49:32', 'payment_proof-1754758172125-137824516.jpeg', NULL, NULL, NULL),
(5, 5, 'Premium Plus', 'active', '2025-08-12', '2026-09-11', '2026-08-12 20:29:10', 'payment_proof-1755030550178-221400459.jpeg', 'sam', 'opay', '1234567890'),
(6, 10, 'Premium Plus', 'active', '2025-08-12', '2026-09-11', '2026-08-12 20:29:10', 'payment_proof-1755030550178-221400459.jpeg', 'sam', 'opay', '1234567890'),
(8, 3, 'Premium Plus', 'cancelled', '2026-05-24', '2026-06-23', '2026-05-24 15:25:29', NULL, NULL, NULL, NULL),
(10, 3, 'Premium Plus', 'active', '2026-05-24', '2026-06-23', '2026-05-24 15:52:48', 'payment_proof-1779637968635-773904636.jpg', 'Access Bank', 'Forrest Green', '0690000031'),
(11, 13, 'Premium Plus', 'active', '2026-05-26', '2026-06-25', '2026-05-26 09:21:14', 'payment_proof-1779787274604-428723068.jpg', 'Titan Trust Bank', 'Shana', '173838763733'),
(12, 13, 'Premium Plus', 'active', '2026-05-26', '2026-06-25', '2026-05-26 09:30:40', NULL, NULL, NULL, NULL),
(13, 14, 'Premium Plus', 'active', '2026-05-26', '2026-06-25', '2026-05-26 16:23:50', 'payment_proof-1779812630177-634495402.jpeg', 'Opay', 'SAMUEL OGHENEFEJIRO OGHENECHOVWE', '7065785436');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `bio` text DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `bio`, `password_hash`, `role`, `verified`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@admin.com', 'I am sam, food user', '$2b$10$9NIZwgqhRNi5o5hk6E3q8.Eta8oZCnoxaFXMdTRiJHUJiRbjHM3x2', 'admin', 1, '2025-07-28 14:56:08', '2025-07-28 15:00:37'),
(3, 'sam', '8amjoker@gmail.com', 'hi there', '$2b$10$waA0guwdoQnsBN6xAe11C.tpv6SzkBTb/jeYimgZhRjdELtmJkIVa', 'user', 1, '2025-07-28 15:06:13', '2025-08-12 20:58:35'),
(5, '8amlight', '8amlight@gmail.com', 'am the player all eyes on me i need to scoa', '$2b$10$tyQDMUSl5N0M7QRXRH6AgugI6zXm7YfrLJ3/unvvOteHUbJfpeMqC', 'user', 1, '2025-08-12 20:27:48', '2025-08-12 20:28:14'),
(10, 'sam1', 'oghenesupersam@gmail.com', 'I am sam, food user', '$2b$10$eMdC5mNCQvLPj5KTyaq4A.EpmjZoz6pvXq2iqtkVrIRxcQ2p/2oTW', 'user', 1, '2025-08-15 11:22:47', '2025-08-15 11:23:31'),
(11, 'dbill', 'jossycode@gmail.com', 'foodie', '$2b$10$C0Z1Sf.j2DLF2LetIOeFVOztvRLjF0OjdGEb1iNnidfwnVSs5O5Fm', 'user', 0, '2026-04-09 10:26:06', '2026-04-09 10:26:06'),
(12, 'd', 'jossycode0@gmail.com', 'foodie', '$2b$10$3LQfpTeEt3.ku0FcM42am.yLFkTpoOkJN417yWsksSSIpHMdnMFuO', 'user', 1, '2026-04-09 10:30:43', '2026-04-09 10:31:20'),
(13, 'chef jay', 'dbillionnejay@gmail.com', 'Cooking on and off the kitchen 😋🔥', '$2b$10$kDDfCuFpEtVdCzamp7OFVu.UY4sr5mGHcOW9JPq5uYgcca4M7rKXW', 'user', 1, '2026-05-26 09:18:36', '2026-05-26 16:21:31'),
(14, 'Farex', 'euidfarex@gmail.com', '', '$2b$10$yp7mR.FyxstyI7K8EfFDJOW6KgMtzLJf7txvXqVLQgc0WJjZ0AvU2', 'user', 1, '2026-05-26 16:18:54', '2026-05-26 16:19:53');

-- --------------------------------------------------------

--
-- Table structure for table `user_storage`
--

CREATE TABLE `user_storage` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_storage`
--

INSERT INTO `user_storage` (`id`, `user_id`, `item_name`, `created_at`) VALUES
(13, 5, 'Garri', '2026-04-09 10:16:55'),
(14, 5, 'Oil', '2026-04-09 10:16:56'),
(15, 5, 'Fish', '2026-04-09 10:16:57'),
(16, 5, 'Beans', '2026-04-09 10:16:58'),
(17, 5, 'Rice', '2026-04-09 10:16:59'),
(18, 5, 'Spaghetti', '2026-04-09 10:17:15'),
(19, 5, 'Tomato', '2026-05-21 17:38:29'),
(20, 5, 'Pepper', '2026-05-21 17:41:49'),
(21, 5, 'Salt', '2026-05-21 17:41:54'),
(22, 5, 'Yam', '2026-05-21 17:41:59'),
(23, 13, 'Rice', '2026-05-26 09:30:53'),
(24, 13, 'Beans', '2026-05-26 09:31:01'),
(25, 13, 'Tomato', '2026-05-26 09:31:07'),
(26, 13, 'Onion', '2026-05-26 09:31:14'),
(27, 13, 'Oil', '2026-05-26 09:31:18'),
(28, 13, 'Salt', '2026-05-26 09:31:26'),
(29, 13, 'Yam', '2026-05-26 09:31:37'),
(31, 14, 'Rice', '2026-05-26 16:24:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_account_number` (`account_number`);

--
-- Indexes for table `chat_history`
--
ALTER TABLE `chat_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_session` (`session_id`);

--
-- Indexes for table `foods`
--
ALTER TABLE `foods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `food_feed_comments`
--
ALTER TABLE `food_feed_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_feed_comment_post` (`post_id`,`created_at`),
  ADD KEY `idx_feed_comment_user` (`user_id`);

--
-- Indexes for table `food_feed_comment_reactions`
--
ALTER TABLE `food_feed_comment_reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_feed_comment_reactor` (`comment_id`,`reactor_user_id`),
  ADD KEY `idx_feed_comment_reaction_comment` (`comment_id`),
  ADD KEY `idx_feed_comment_reaction_post` (`post_id`);

--
-- Indexes for table `food_feed_follows`
--
ALTER TABLE `food_feed_follows`
  ADD PRIMARY KEY (`follower_user_id`,`following_user_id`),
  ADD KEY `idx_feed_following` (`following_user_id`);

--
-- Indexes for table `food_feed_posts`
--
ALTER TABLE `food_feed_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_feed_expires` (`expires_at`),
  ADD KEY `idx_feed_user_created` (`user_id`,`created_at`);

--
-- Indexes for table `food_feed_reactions`
--
ALTER TABLE `food_feed_reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_feed_post_reactor` (`post_id`,`reactor_user_id`),
  ADD KEY `idx_feed_reactor` (`reactor_user_id`,`created_at`),
  ADD KEY `idx_feed_author` (`post_author_user_id`,`created_at`);

--
-- Indexes for table `message_bot_messages`
--
ALTER TABLE `message_bot_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `otps`
--
ALTER TABLE `otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plan_name` (`plan_name`);

--
-- Indexes for table `storage_friend_suggestions`
--
ALTER TABLE `storage_friend_suggestions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_owner_user_id` (`owner_user_id`),
  ADD KEY `idx_share_id` (`share_id`),
  ADD KEY `idx_food_id` (`food_id`);

--
-- Indexes for table `storage_items`
--
ALTER TABLE `storage_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `storage_shares`
--
ALTER TABLE `storage_shares`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `share_id` (`share_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_storage`
--
ALTER TABLE `user_storage`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_item_unique` (`user_id`,`item_name`),
  ADD KEY `item_name` (`item_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `chat_history`
--
ALTER TABLE `chat_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `foods`
--
ALTER TABLE `foods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `food_feed_comments`
--
ALTER TABLE `food_feed_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `food_feed_comment_reactions`
--
ALTER TABLE `food_feed_comment_reactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `food_feed_posts`
--
ALTER TABLE `food_feed_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `food_feed_reactions`
--
ALTER TABLE `food_feed_reactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `message_bot_messages`
--
ALTER TABLE `message_bot_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `otps`
--
ALTER TABLE `otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `plans`
--
ALTER TABLE `plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `storage_friend_suggestions`
--
ALTER TABLE `storage_friend_suggestions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `storage_items`
--
ALTER TABLE `storage_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `storage_shares`
--
ALTER TABLE `storage_shares`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `user_storage`
--
ALTER TABLE `user_storage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_history`
--
ALTER TABLE `chat_history`
  ADD CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `otps`
--
ALTER TABLE `otps`
  ADD CONSTRAINT `otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_storage`
--
ALTER TABLE `user_storage`
  ADD CONSTRAINT `user_storage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_storage_ibfk_2` FOREIGN KEY (`item_name`) REFERENCES `storage_items` (`name`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
