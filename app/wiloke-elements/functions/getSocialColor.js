export const getSocialColor = social => {
  switch (social) {
    case "facebook":
      return "#325d94";
    case "twitter":
      return "#00aadb";
    case "flickr":
      return "#ff0084";
    case "tumblr":
      return "#2f4e6b";
    case "dribbble":
      return "#fb4087";
    case "youtube-play":
    case "youtube":
      return "#df2e1c";
    case "vk":
      return "#4c75a3";
    case "digg":
      return "#1b5891";
    case "reddit":
      return "#ff4500";
    case "medium":
      return "#00ab6c";
    case "tripadvisor":
      return "#00af87";
    case "wikipedia-w":
      return "#636466";
    case "skype":
      return "#00aff0";
    case "linkedin":
      return "#1686b0";
    case "whatsapp":
      return "#25d366";
    case "stumbleupon":
      return "#eb4924";
    case "google-plus":
      return "#db4437";
    case "vimeo-square":
    case "vimeo":
      return "#63b3e4";
    case "instagram":
      return "#517fa4";
    case "pinterest":
      return "#cc1d24";
    case "behance":
      return "#1478ff";
    case "heart":
      return "#4bd1fa";
    case "github":
      return "#24292e";
    case "envelope":
      return "#5540f7";
    case "link":
      return "#f06292";
    case "odnoklassniki":
      return "#ee8208";
    default:
      return "#222";
  }
};
