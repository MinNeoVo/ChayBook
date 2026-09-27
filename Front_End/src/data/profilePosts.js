const profilePosts = [
  {
    id: 1,
    status: "APPROVED",
    author: {
      name: "Sarah Green",
      role: "Plant-based Food Enthusiast",
      initials: "SG",
      verified: true,
      avatar: "https://i.pravatar.cc/150?img=47",
    },
    time: "2 hours ago",
    source: "Public Community Feed",
    category: { label: "Stories & Journals", icon: "wellness" },
    title: "My Journey to Becoming a Vegetarian: First 30 Days",
    description:
      "I've been thinking about changing my eating habits for a long time. Today marks 30 days of eating 100% plant-based bowls! Feeling more energized than ever, improved digestion, and rediscovering deep flavors from local Vietnamese herbs and sesame-tempeh marinades.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Plant-based bowl",
    nutrition: "24g Protein • 520 kcal",
    stats: { likes: 32, comments: 8 },
    action: "Read Story",
    actionIcon: "book",
  },
  {
    id: 2,
    status: "DENIED",
    author: {
      name: "Sarah Green",
      role: "Plant-based Food Enthusiast",
      initials: "SG",
      verified: false,
      avatar: "https://i.pravatar.cc/150?img=47",
    },
    time: "1 day ago",
    source: "Submission Review",
    category: { label: "Recipe", icon: "recipe" },
    title: "Quick Homemade Green Smoothie Formula",
    description:
      "Here is my favorite 5-minute morning energizer using organic baby spinach, crisp green apple, chia seeds, and unflavored fortified oat milk.",
    image:
      "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Homemade green smoothie",
    moderationFeedback:
      "Content flagged — Please ensure all submitted recipes include specific metric ingredient measurements (grams/milliliters) and verify that photos have no visible commercial brand stamps.",
    stats: { likes: 0, comments: 0 },
    action: "Edit & Resubmit",
    actionIcon: "edit",
  },
  {
    id: 3,
    status: "PENDING",
    author: {
      name: "Sarah Green",
      role: "Plant-based Food Enthusiast",
      initials: "SG",
      verified: false,
      avatar: "https://i.pravatar.cc/150?img=47",
    },
    time: "Just now",
    source: "Awaiting Verification",
    category: { label: "Recipe", icon: "recipe" },
    title: "Golden Turmeric Roasted Pumpkin & Ginger Soup",
    description:
      "A warming autumn recipe packed with natural anti-inflammatory polyphenols, roasted pepitas, velvety coconut cream swirl, and freshly grated mountain ginger root.",
    image:
      "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Pumpkin ginger soup",
    stats: { likes: 0, comments: 0 },
    action: "Edit Details",
    actionIcon: "edit",
  },
  {
    id: 4,
    status: "APPROVED",
    author: {
      name: "Sarah Green",
      role: "Plant-based Food Enthusiast",
      initials: "SG",
      verified: true,
      avatar: "https://i.pravatar.cc/150?img=47",
    },
    time: "3 days ago",
    source: "Recipe Collection",
    category: { label: "Recipe", icon: "recipe" },
    title: "Crispy Tofu & Kalamata Greek-Style Garden Salad",
    description:
      "Swapping conventional dairy for lemon-oregano pressed almond feta! Combined with sun-ripened heirloom cherry tomatoes, Persian cucumbers, and cold-pressed extra virgin olive oil.",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Mediterranean tofu salad",
    nutrition: "Certified 100% Vegan",
    stats: { likes: 64, comments: 19 },
    action: "Read Recipe",
    actionIcon: "book",
  },
];
export default profilePosts;
