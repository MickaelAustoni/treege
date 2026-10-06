import { Edge, Node } from "@xyflow/react";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { NODE_TYPE } from "@/shared/constants/node";
import { UI_TYPE } from "@/shared/constants/uiType";
import { Flow, InputNodeData, InputOption, UINodeData } from "@/shared/types/node";

/**
 * A field of the showcase: an input or a UI element, listed in the order it is displayed.
 */
type ShowcaseField =
  | { id: string; type: typeof NODE_TYPE.input; data: InputNodeData }
  | { id: string; type: typeof NODE_TYPE.ui; data: UINodeData };

/**
 * Vertical gap between two nodes on the editor canvas. The renderer orders fields by following the edges,
 * the positions only keep the flow readable when it is opened in the editor.
 */
const NODE_VERTICAL_GAP = 160;

const inputField = (id: string, data: InputNodeData): ShowcaseField => ({ data, id, type: NODE_TYPE.input });

const uiField = (id: string, data: UINodeData): ShowcaseField => ({ data, id, type: NODE_TYPE.ui });

const CONTACT_OPTIONS: InputOption[] = [
  { label: { en: "Email", fr: "E-mail" }, value: "email" },
  { label: { en: "Phone", fr: "Téléphone" }, value: "phone" },
  { label: { en: "Post", fr: "Courrier" }, value: "post" },
];

const PLAN_OPTIONS: InputOption[] = [
  {
    description: { en: "For personal projects", fr: "Pour les projets personnels" },
    label: { en: "Starter", fr: "Débutant" },
    value: "starter",
  },
  {
    description: { en: "For growing teams", fr: "Pour les équipes en croissance" },
    label: { en: "Team", fr: "Équipe" },
    value: "team",
  },
  {
    description: { en: "For large organizations", fr: "Pour les grandes organisations" },
    label: { en: "Enterprise", fr: "Entreprise" },
    value: "enterprise",
  },
];

const COUNTRY_OPTIONS: InputOption[] = [
  { label: { en: "Belgium", fr: "Belgique" }, value: "be" },
  { label: { en: "Canada", fr: "Canada" }, value: "ca" },
  { label: { en: "France", fr: "France" }, value: "fr" },
  { label: { en: "Germany", fr: "Allemagne" }, value: "de" },
  { label: { en: "Italy", fr: "Italie" }, value: "it" },
  { label: { en: "Spain", fr: "Espagne" }, value: "es" },
  { label: { en: "Switzerland", fr: "Suisse" }, value: "ch" },
  { label: { en: "United Kingdom", fr: "Royaume-Uni" }, value: "gb" },
  { label: { en: "United States", fr: "États-Unis" }, value: "us" },
];

/**
 * Every field type of the renderer, in display order. None of them sits in a group and no edge carries a
 * condition, so the whole list is one single step: every field is on screen as soon as the form opens.
 */
const SHOWCASE_FIELDS: ShowcaseField[] = [
  uiField("title-text", { label: { en: "Text fields", fr: "Champs texte" }, type: UI_TYPE.title }),
  inputField("text", {
    helperText: { en: "A single-line text field", fr: "Un champ texte sur une ligne" },
    label: { en: "Text", fr: "Texte" },
    name: "text",
    placeholder: { en: "Jane Doe", fr: "Jeanne Dupont" },
    required: true,
    type: INPUT_TYPE.text,
  }),
  inputField("number", {
    label: { en: "Number", fr: "Nombre" },
    name: "number",
    placeholder: { en: "42", fr: "42" },
    type: INPUT_TYPE.number,
  }),
  inputField("password", {
    label: { en: "Password", fr: "Mot de passe" },
    name: "password",
    placeholder: { en: "At least 8 characters", fr: "Au moins 8 caractères" },
    type: INPUT_TYPE.password,
  }),
  inputField("textarea", {
    label: { en: "Textarea", fr: "Zone de texte" },
    name: "textarea",
    placeholder: { en: "Tell us more…", fr: "Dites-nous en plus…" },
    type: INPUT_TYPE.textarea,
  }),

  uiField("divider-choices", { type: UI_TYPE.divider }),
  uiField("title-choices", { label: { en: "Choices", fr: "Choix" }, type: UI_TYPE.title }),
  inputField("select", {
    label: { en: "Select", fr: "Liste déroulante" },
    name: "select",
    options: CONTACT_OPTIONS,
    placeholder: { en: "Pick one", fr: "Choisissez" },
    type: INPUT_TYPE.select,
  }),
  inputField("select-multiple", {
    label: { en: "Select (multiple)", fr: "Liste déroulante (multiple)" },
    multiple: true,
    name: "selectMultiple",
    options: CONTACT_OPTIONS,
    placeholder: { en: "Pick several", fr: "Choisissez-en plusieurs" },
    type: INPUT_TYPE.select,
  }),
  inputField("autocomplete", {
    label: { en: "Autocomplete", fr: "Autocomplétion" },
    name: "autocomplete",
    options: COUNTRY_OPTIONS,
    placeholder: { en: "Search a country", fr: "Rechercher un pays" },
    type: INPUT_TYPE.autocomplete,
  }),
  inputField("radio-card", {
    label: { en: "Radio (cards)", fr: "Boutons radio (cartes)" },
    name: "radioCard",
    options: PLAN_OPTIONS,
    type: INPUT_TYPE.radio,
    variant: "card",
  }),
  inputField("radio-default", {
    label: { en: "Radio (default)", fr: "Boutons radio (défaut)" },
    name: "radioDefault",
    options: CONTACT_OPTIONS,
    type: INPUT_TYPE.radio,
    variant: "default",
  }),
  inputField("checkbox-group", {
    label: { en: "Checkbox (group)", fr: "Cases à cocher (groupe)" },
    name: "checkboxGroup",
    options: CONTACT_OPTIONS,
    type: INPUT_TYPE.checkbox,
  }),
  inputField("checkbox-single", {
    label: { en: "Checkbox (single)", fr: "Case à cocher (seule)" },
    name: "checkboxSingle",
    type: INPUT_TYPE.checkbox,
  }),
  inputField("switch", {
    helperText: { en: "A simple on/off toggle", fr: "Un simple interrupteur" },
    label: { en: "Switch", fr: "Interrupteur" },
    name: "switch",
    type: INPUT_TYPE.switch,
  }),

  uiField("divider-dates", { type: UI_TYPE.divider }),
  uiField("title-dates", { label: { en: "Date & time", fr: "Date et heure" }, type: UI_TYPE.title }),
  inputField("date", {
    label: { en: "Date", fr: "Date" },
    name: "date",
    type: INPUT_TYPE.date,
  }),
  inputField("daterange", {
    disablePast: true,
    helperText: { en: "Past dates are disabled", fr: "Les dates passées sont désactivées" },
    label: { en: "Date range", fr: "Plage de dates" },
    name: "daterange",
    type: INPUT_TYPE.daterange,
  }),
  inputField("time", {
    label: { en: "Time", fr: "Heure" },
    name: "time",
    type: INPUT_TYPE.time,
  }),
  inputField("timerange", {
    label: { en: "Time range", fr: "Plage horaire" },
    name: "timerange",
    type: INPUT_TYPE.timerange,
  }),

  uiField("divider-advanced", { type: UI_TYPE.divider }),
  uiField("title-advanced", { label: { en: "Advanced", fr: "Avancé" }, type: UI_TYPE.title }),
  inputField("address", {
    label: { en: "Address", fr: "Adresse" },
    name: "address",
    placeholder: { en: "Search an address", fr: "Rechercher une adresse" },
    type: INPUT_TYPE.address,
  }),
  inputField("file", {
    label: { en: "File", fr: "Fichier" },
    multiple: true,
    name: "file",
    type: INPUT_TYPE.file,
  }),
  inputField("http-select", {
    helperText: { en: "Options fetched when the form opens", fr: "Options chargées à l'ouverture du formulaire" },
    httpConfig: {
      fetchOnMount: true,
      method: "GET",
      responseMapping: { descriptionField: "email", labelField: "name", valueField: "id" },
      showLoading: true,
      url: "https://jsonplaceholder.typicode.com/users",
    },
    label: { en: "HTTP (select)", fr: "HTTP (liste)" },
    name: "httpSelect",
    placeholder: { en: "Pick a user", fr: "Choisissez un utilisateur" },
    type: INPUT_TYPE.http,
  }),
  inputField("http-search", {
    helperText: { en: "Options fetched as you type", fr: "Options chargées pendant la saisie" },
    httpConfig: {
      method: "GET",
      responseMapping: { descriptionField: "email", labelField: "firstName", valueField: "id" },
      responsePath: "users",
      searchParam: "q",
      showLoading: true,
      url: "https://dummyjson.com/users/search",
    },
    label: { en: "HTTP (search)", fr: "HTTP (recherche)" },
    name: "httpSearch",
    placeholder: { en: "Search a user", fr: "Rechercher un utilisateur" },
    type: INPUT_TYPE.http,
  }),

  // Renders nothing: its value only shows up in the submitted values
  inputField("hidden", {
    defaultValue: { staticValue: "native-example", type: "static" },
    name: "hidden",
    type: INPUT_TYPE.hidden,
  }),
  // Renders nothing either: it only gives its label to the submit button
  inputField("submit", {
    label: { en: "Send the form", fr: "Envoyer le formulaire" },
    type: INPUT_TYPE.submit,
  }),
];

const nodes: Node[] = SHOWCASE_FIELDS.map((field, index) => ({
  ...field,
  position: { x: 0, y: index * NODE_VERTICAL_GAP },
}));

/**
 * One unconditional edge from each field to the next one, in the order of the list.
 */
const edges: Edge[] = SHOWCASE_FIELDS.slice(1).map((field, index) => {
  const previousField = SHOWCASE_FIELDS[index];

  return {
    id: `${previousField.id}-to-${field.id}`,
    source: previousField.id,
    target: field.id,
    type: "default",
  };
});

export const allFieldsFlow: Flow = {
  edges,
  id: "native-all-fields",
  nodes,
};
