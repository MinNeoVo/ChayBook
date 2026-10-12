const featuredRecords = [
  {
    type: "VIDEO",
    title: "#TraiTimBangGia",
    creator: "TraiTimBangGia",
    description: "Vegan Hotpot Recipe",
    submittedDate: "04/09/2026",
    submittedTime: "14:20",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=120&q=80",
  },
  {
    type: "VIDEO",
    title: "#Youngtobdisak",
    creator: "Youngtobdisak",
    description: "Acai Superfood Bowl",
    submittedDate: "12/05/2026",
    submittedTime: "07:40",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&q=80",
  },
  {
    type: "POST",
    title: "#MCK",
    creator: "MCK",
    description: "10-Min Sesame Tempeh Meal",
    submittedDate: "14/09/2026",
    submittedTime: "21:00",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80",
  },
  {
    type: "POST",
    title: "#BabyRed",
    creator: "BabyRed",
    description: "Artisan Sourdough Toast",
    submittedDate: "04/09/2026",
    submittedTime: "14:20",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=120&q=80",
  },
  {
    type: "VIDEO",
    title: "#AnhNhoEm",
    creator: "AnhNhoEm",
    description: "Turmeric Coconut Dahl",
    submittedDate: "04/09/2026",
    submittedTime: "15:21",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=120&q=80",
  },
  {
    type: "POST",
    title: "#AvocadoSalad",
    creator: "SarahGreen",
    description: "Summer Avocado Crunch",
    submittedDate: "03/09/2026",
    submittedTime: "11:15",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&q=80",
  },
  {
    type: "VIDEO",
    title: "#RawJuiceFast",
    creator: "Khang",
    description: "3-Day Cleanse Walkthrough",
    submittedDate: "02/09/2026",
    submittedTime: "09:30",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=120&q=80",
  },
];

// Shared sample clip for mock video entries until real media URLs are available.
const MOCK_VIDEO_URL =
  "https://videos.pexels.com/video-files/3981705/3981705-uhd_3840_2160_30fps.mp4";

const creators = [
  "LinhKitchen",
  "PlantBasedMinh",
  "GreenFork",
  "AnNhien",
  "ThuCooking",
  "VeganByMai",
  "BepNha",
  "NamEats",
  "SunnyTable",
  "ChayMoiNgay",
  "SarahGreen",
  "Khang",
];

const titles = [
  "GardenHarvest",
  "BepNhaXanh",
  "VeggieComfort",
  "GreenLunchbox",
  "MindfulMeals",
  "PlantPower",
  "FreshFromHome",
  "EverydayGreens",
  "CozyKitchen",
  "ChayThatNgon",
];

const descriptions = [
  "Roasted seasonal vegetables",
  "Crispy tofu rice bowl",
  "Fresh herb spring rolls",
  "Coconut curry noodles",
  "Easy weekday veggie lunch",
  "Mushroom and lentil stew",
  "Green mango salad",
  "Homemade plant-based meal",
  "Five-minute breakfast idea",
  "Colorful market vegetable bowl",
];

const thumbnails = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=120&q=80",
];

const rejectionReasons = [
  "The submission includes an uncredited image. Please add a source or use an original photo.",
  "This entry needs clearer ingredient information before it can be shared with the community.",
  "The video contains material that is not related to plant-based cooking.",
  "Please remove the promotional link and submit the recipe again.",
  "The same content has already been shared by this account.",
  "The thumbnail does not match the recipe described in the post.",
  "Some community details need editing before this can be published.",
];

function getStatus(id) {
  if (id <= 27) return "PENDING";
  if (id <= 121) return "APPROVED";
  return "REJECTED";
}

function getType(id) {
  if (id <= featuredRecords.length) return featuredRecords[id - 1].type;

  const position = id - featuredRecords.length - 1;
  return position % 3 === 0 || position === 1 ? "VIDEO" : "POST";
}

function createGeneratedRecord(id) {
  const status = getStatus(id);
  const type = getType(id);
  const creator = creators[(id - 1) % creators.length];
  const title = titles[(id - 1) % titles.length];

  return {
    id,
    type,
    title: `#${title}${id}`,
    creator,
    description: descriptions[(id - 1) % descriptions.length],
    submittedDate: `${String(((id - 1) % 28) + 1).padStart(2, "0")}/09/2026`,
    submittedTime: `${String((id * 7) % 24).padStart(2, "0")}:${String((id * 13) % 60).padStart(2, "0")}`,
    status,
    thumbnailUrl: thumbnails[(id - 1) % thumbnails.length],
    videoUrl: type === "VIDEO" ? MOCK_VIDEO_URL : "",
    rejectionReason:
      status === "REJECTED"
        ? rejectionReasons[(id - 122) % rejectionReasons.length]
        : "",
  };
}

export const adminPostVideoMockData = [
  ...featuredRecords.map((record, index) => ({
    ...record,
    id: index + 1,
    status: "PENDING",
    rejectionReason: "",
    videoUrl: record.type === "VIDEO" ? MOCK_VIDEO_URL : "",
  })),
  ...Array.from({ length: 121 }, (_, index) =>
    createGeneratedRecord(index + featuredRecords.length + 1),
  ),
];

export function createAdminPostVideoMockData() {
  return adminPostVideoMockData.map((record) => ({ ...record }));
}
