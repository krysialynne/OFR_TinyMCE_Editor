const BASE_TOOLBAR =
  "undo redo | blocks | bold italic underline | fontfamily fontsize forecolor backcolor | alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist | hr pagebreak | image media link | table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | code help";

export function buildToolbar(showSaveButton: boolean): string {
  return showSaveButton ? `${BASE_TOOLBAR} | save` : BASE_TOOLBAR;
}

const BASE_PLUGINS: readonly string[] = [
  "advlist", "anchor", "autolink", "autoresize", "autosave", "charmap",
  "code", "codesample", "directionality", "emoticons", "fullscreen",
  "help", "image", "importcss", "insertdatetime", "link", "lists",
  "media", "nonbreaking", "pagebreak", "preview", "quickbars",
  "searchreplace", "table", "visualblocks", "visualchars", "wordcount",
];

export function buildPlugins(showSaveButton: boolean): string[] {
  return showSaveButton ? [...BASE_PLUGINS, "save"] : [...BASE_PLUGINS];
}
