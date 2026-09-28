/**
 * Mock data for ChayBook content pages.
 *
 * This file is responsible for:
 * - Storing content mock data.
 * - Providing content list access.
 * - Finding content by ID.
 * - Finding content by slug.
 */

const contentData = [
  {
    id: 1,
    slug: "avocado-quinoa-salad",
    category: "recipes",
    categoryLabel: "Recipes",
    categoryColor: "secondary",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1UmS85DWMio266GaCmBtoF5p2SbdcO-D7YXEYhjqB2bMqDjA8eeyu8SBYPi3YX9xW_DldcWAqyznz_bKUv7B1lrtk9CGVucoF_hES-abjw8Vwjt76bdkvM_MasS8akxPrNQTBGjsc0M-fF21QL0AI-MkdCTq5dZWs57F2BthWk3iFciw5sVVacB_bF8zBu2TNtClZ4oDcmbTq9JASYh-Ssi6LQFOKZQBh0LBLToo_LDPPUfeMl7fVASIw",
    imageAlt: "Avocado Quinoa Salad",
    title:
      "Avocado Quinoa Salad – A healthy, easy-to-make vegetarian meal at home",
    description:
      "A colorful, nutrient-packed bowl full of fresh vegetables, quinoa and a zesty tahini dressing. Perfect for lunch.",
    content:
      "This avocado quinoa salad is a simple and nutritious vegetarian meal that combines fluffy quinoa, creamy avocado, fresh vegetables and a zesty tahini dressing. It is perfect for a quick lunch or a light dinner.",
    author: "Sarah Green",
    authorRole: "Dietitian",
    initials: "SG",
    authorColor: "primary",
    calories: "495 kcal",
    comments: 24,
    createdAt: "2024-04-12",
    date: "Apr 12, 2024",
    duration: "15 min prep",
    durationIcon: "timer",
    action: "Read Recipe",
  },

  {
    id: 2,
    slug: "fresh-homemade-avocado-sourdough",
    category: "recipes",
    categoryLabel: "Recipes",
    categoryColor: "secondary",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1VdoBwdTrLghRZZ_PtVBBlZ89DAvHTxETbhzjwbR3Ztnxx9IsbpW1-HWpGK6kQFqIzAVK0lr9gT1UbLdIQDtnjNsIVAyALcNWMopB_RFFYcR44Ze06IDeZ9QvplZy5O8iJOSZ6TFQKXTtAvf8QpVrBAOirrER8hUAwPt12b2gMcbBfe4sLtxn-ZJUacgil9zs1vbEzwfSf7DZhZ1xp2JtJROSUxvg8gjmWmqaNeqGVZGICrS--aSkdKUlo",
    imageAlt: "Fresh Homemade Avocado Sourdough with Microgreens",
    title: "Fresh Homemade Avocado Sourdough with Microgreens",
    description:
      "Loaded with monounsaturated healthy fats, crunchy radish, and living microgreen enzymes for vital mornings.",
    content:
      "Fresh sourdough topped with creamy avocado, crunchy radish and nutrient-rich microgreens makes a balanced and satisfying breakfast. This recipe is quick to prepare and works well for busy mornings.",
    author: "Sarah Green",
    authorRole: "Dietitian",
    initials: "SG",
    authorColor: "primary",
    calories: "320 kcal",
    comments: 18,
    createdAt: "2024-04-10",
    date: "Apr 10, 2024",
    duration: "10 min",
    durationIcon: "timer",
    action: "Read Recipe",
  },

  {
    id: 3,
    slug: "creamy-roasted-pumpkin-ginger-soup",
    category: "nutrition",
    categoryLabel: "Nutrition",
    categoryColor: "tertiary",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1V0eAO_LvyrGJcFiQB34FJw4nozoRO_veC_LMZNMCoM-hsyU8LQFcPaqbMRHvjXXQ7nrROnEbcWe2bNjYXms1Axu-WXuIyYcWZYzgaupKO7-pRICvxaUG2l8IuLTk7JgwPqfYpVN9cCo1Ud6mb6j5A-YGzx3QGICOrpO2tZx5bcOiNBaOJ7t28eiWzbLsigjDh1CvTEmNJiZE-aWG-xqrhwFfLg6eIngtfZPcvMo6xEwZeqUzxRdhQUW1M",
    imageAlt: "Creamy Roasted Pumpkin Ginger Soup with Pepitas",
    title: "Creamy Roasted Pumpkin Ginger Soup with Pepitas",
    description:
      "Warm anti-inflammatory comfort bowl slow-simmered with coconut milk, turmeric, and toasted pumpkin seeds.",
    content:
      "This creamy pumpkin and ginger soup combines roasted pumpkin with coconut milk, turmeric and fresh ginger. Pumpkin seeds add a pleasant crunch and extra nutrients to this comforting vegetarian meal.",
    author: "Dr. Elena Rostova",
    authorRole: "Nutritionist",
    initials: "ER",
    authorColor: "tertiary",
    calories: "210 kcal",
    comments: 32,
    createdAt: "2024-04-08",
    date: "Apr 08, 2024",
    duration: "25 min",
    durationIcon: "timer",
    action: "Read Guide",
  },

  {
    id: 4,
    slug: "crisp-summer-spring-rolls",
    category: "recipes",
    categoryLabel: "Recipes",
    categoryColor: "secondary",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZSGiIGGjN8CjLlk3LP3FeMMMXQGAaj0xartwNFiRVf_vU6A6BeIQXIpRQsI-W5Ljc2K_-3lh-KLZwXpN-ADBFkJkCGxVMGaKZoPJk_j1qTwx7_9CO-kVOltKdBms-8I_RuRM4WBPNp8Ck999j2-zM4OrI2IQN8WVmfsqpkz7EEbkzSakqe9j8oti5YpYm89VkX2lxNbhSOP5TX5EOyyaWjetfblNC7DEzGNA36Dhk3dEOHGoHmb3s",
    imageAlt: "Crisp Summer Spring Rolls with Zesty Peanut Dip",
    title: "Crisp Summer Spring Rolls with Zesty Peanut Dip",
    description:
      "Refreshing rice paper rolls packed with crisp cucumber, mint, carrots, and vermicelli with rich peanut dip.",
    content:
      "These fresh summer spring rolls are packed with cucumber, mint, carrots and vermicelli. Served with a rich peanut dipping sauce, they make a refreshing vegetarian lunch or appetizer.",
    author: "Tien Nguyen",
    authorRole: "Culinary Lead",
    initials: "TN",
    authorColor: "secondary",
    calories: "280 kcal",
    comments: 14,
    createdAt: "2024-04-05",
    date: "Apr 05, 2024",
    duration: "20 min",
    durationIcon: "timer",
    action: "Read Recipe",
  },

  {
    id: 5,
    slug: "mediterranean-herb-garden-salad",
    category: "lifestyle",
    categoryLabel: "Lifestyle",
    categoryColor: "lifestyle",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCLEIrN9wQ2uGj1OP6aezuzV2YQn0RpoIk-aNBblA5CqQZBkB9jtCwePqWayvgl1q_xOdv4VTEoo96Lq9hMm_CdMkU7tFQF0nN8k2wONk3rbXSveCzaeBtfJYU7U9WgtOg_xiTwZmynCHXDQx3-hhbn_lQdv_2TdolhwJWZd75IVllKaJALTVlBK4Hj84OBjB0fEIVE-M6LAglc8JYjDihwVTpP6xETydFW8iUq7x24WpLzKmpNcpxg",
    imageAlt: "Mediterranean Herb Garden Salad with Kalamata Olives",
    title: "Mediterranean Herb Garden Salad with Kalamata Olives",
    description:
      "Sun-ripened organic tomatoes, crisp Persian cucumbers, oregano-infused cold-pressed olive oil, and plant feta.",
    content:
      "This Mediterranean-inspired salad combines ripe tomatoes, Persian cucumbers, Kalamata olives, fresh herbs and plant-based feta. A simple olive oil and oregano dressing brings everything together.",
    author: "Marcus Vance",
    authorRole: "Holistic Coach",
    initials: "MV",
    authorColor: "tertiary-container",
    calories: "240 kcal",
    comments: 19,
    createdAt: "2024-04-03",
    date: "Apr 03, 2024",
    duration: "12 min",
    durationIcon: "timer",
    action: "Read Story",
  },

  {
    id: 6,
    slug: "high-protein-vegetarian-meal-prepping",
    category: "tips",
    categoryLabel: "Tips",
    categoryColor: "primary",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1VTLHEzsp0n2ra6xBNduvIDDgPZ76VrN-cr43gmM8kp8WasUNdFB-ioeyQszojmDC3t3xmS8H_BPMJUgnGCSbFyQJYNkzp3Pi-XR4DFMK_douWI32E9NlOek1DxwgtYTS6jrkVW43i3xgZttabm-s1HHss0UFlU5N-_DVmV1c3m0TL_6NtuFtf3WEWob4cIZzzzPWbA2m_kOZhu4NBcsYns5MN8d4xk_SL5g0SW0Ok5LJxThdMaE7Gba90",
    imageAlt: "The Complete Guide to High-Protein Vegetarian Meal Prepping",
    title: "The Complete Guide to High-Protein Vegetarian Meal Prepping",
    description:
      "How to batch-cook balanced macro grain bowls with diverse plant proteins to save time during busy workweeks.",
    content:
      "Meal prepping can make healthy vegetarian eating much easier during busy weeks. This guide explains how to prepare grain bowls, legumes, tofu and other plant proteins in batches while keeping meals balanced and varied.",
    author: "Sarah Green",
    authorRole: "Dietitian",
    initials: "SG",
    authorColor: "primary",
    calories: null,
    comments: 42,
    createdAt: "2024-03-28",
    date: "Mar 28, 2024",
    duration: "8 min read",
    durationIcon: "book",
    action: "Read Guide",
  },
];

/**
 * Return all content items.
 */
export function getContentList() {
  return contentData;
}

/**
 * Find a content item by numeric ID.
 */
export function getContentById(id) {
  const numericId = Number(id);

  if (Number.isNaN(numericId)) {
    return undefined;
  }

  return contentData.find((content) => content.id === numericId);
}

/**
 * Find a content item by URL slug.
 */
export function getContentBySlug(slug) {
  if (!slug) {
    return undefined;
  }

  return contentData.find((content) => content.slug === slug);
}

export default contentData;
