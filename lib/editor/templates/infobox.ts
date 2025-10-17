export interface InfoBoxItem {
  // Main title of the infobox
  title: string;
  
  // Optional subtitle
  subtitle?: string;
  
  // Image configuration
  image?: {
    url: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
  };
  
  // Multiple header sections
  sections: InfoBoxSection[];
}

export interface InfoBoxSection {
  // Section header title
  header?: string;
  
  // Fields in this section
  fields: InfoBoxField[];
}

export interface InfoBoxField {
  // Field label (left column)
  label: string;
  
  // Field value - can be string, array, or object for complex values
  value: string | string[] | ComplexValue;
  
  // Optional field type for special rendering
  type?: "link" | "image" | "signature" | "date" | "coordinates";
  
  // Optional CSS class for custom styling
  className?: string;
  
  // Optional tooltip
  tooltip?: string;
}

export interface ComplexValue {
  // For values with links
  text: string;
  href?: string;
  
  // For values with additional info
  subtext?: string;
  
  // For image values
  image?: {
    url: string;
    alt: string;
    width?: number;
  };
}

export interface Coordinates {
  lat: number;
  lng: number;
  format?: "dms" | "decimal";
}

// Complete example structure
export const InfoBox: InfoBoxItem[] = [
  {
    title: "Entity Name",
    subtitle: "Optional subtitle",
    image: {
      url: "path/to/image.jpg",
      alt: "Image description",
      caption: "Image caption text",
      width: 250,
      height: 300
    },
    sections: [
      {
        header: "Section 1 Header",
        fields: [
          {
            label: "Field Label",
            value: "Simple text value",
            type: "text"
          },
          {
            label: "List Field",
            value: ["Item 1", "Item 2", "Item 3"],
            type: "link"
          },
          {
            label: "Complex Field",
            value: {
              text: "Main text",
              href: "/path/to/link",
              subtext: "Additional information"
            }
          },
          {
            label: "Coordinates",
            value: "40.7128° N, 74.0060° W",
            type: "coordinates"
          },
          {
            label: "Signature",
            value: "Signature text",
            type: "signature",
            className: "signature-style"
          }
        ]
      },
      {
        header: "Section 2 Header",
        fields: [
          {
            label: "Image Field",
            value: {
              text: "",
              image: {
                url: "path/to/small-image.jpg",
                alt: "Small image alt",
                width: 100
              }
            },
            type: "image"
          }
        ]
      }
    ]
  }
];