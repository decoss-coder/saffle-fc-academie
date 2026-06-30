export const CLUB = {
  name: "SAFFLE FF Académie CI",
  shortName: "SAFFLE FF",
  tagline: "Centre de formation de football",
  city: "Sinfra",
  country: "Côte d'Ivoire",
  location: "Sinfra, Côte d'Ivoire",
  phone: "+225 07 07 20 18 33",
  phoneHref: "tel:+2250707201833",
  facebookUrl: "https://www.facebook.com/profile.php?id=100064944900336",
  siteUrl: "https://saffle-fc-academie.vercel.app",
  colors: {
    green: "#14532d",
    greenLight: "#22c55e",
  },
  assets: {
    logo: "/club/logo.jpg",
    fanion: "/club/fanion.jpg",
    equipeA: "/club/equipe-a.jpg",
    equipeB: "/club/equipe-b.jpg",
    formation: "/club/formation.jpg",
  },
} as const;

export const TEAMS = [
  {
    name: "Équipe A",
    description: "Effectif senior — compétitions et matchs officiels.",
    image: CLUB.assets.equipeA,
  },
  {
    name: "Équipe B",
    description: "Effectif élargi — préparation et rotation.",
    image: CLUB.assets.equipeB,
  },
  {
    name: "Formation",
    description: "Catégories jeunes — U10 à U18, futurs talents de Sinfra.",
    image: CLUB.assets.formation,
  },
] as const;
