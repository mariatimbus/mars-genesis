const legacyText:Record<string,string> = {
  "Selectează o parcelă mică de la margine. Doar parcela confirmată va fi extinsă.": "Select a small edge parcel. Only the parcel you confirm will be expanded.",
  "Extindere anulată.": "Expansion cancelled.",
  "Parcela selectată este pregătită pentru construcții. Restul terenului a rămas neschimbat.": "The selected parcel is ready for construction. The rest of the terrain is unchanged.",
  "Alege o parcelă de la margine și confirmă extinderea. Esc pentru anulare.": "Select an edge parcel and confirm expansion. Esc to cancel.",
  "Extinde doar o parcelă mică aleasă de tine": "Expand only one small parcel of your choice",
  "Extinde terenul": "Expand terrain",
  "EXTINDERE LOCALĂ": "LOCAL EXPANSION",
  "Doar parcela selectată": "Only the selected parcel",
  "Unde vrei să extinzi?": "Where would you like to expand?",
  "Apasă pe o porțiune evidențiată de la margine. Se pregătește doar acea parcelă; restul reliefului rămâne ca înainte.": "Click a highlighted edge parcel. Only that parcel is prepared; the surrounding landscape stays unchanged.",
  "Extinde doar această parcelă": "Expand this parcel only",
  "Anulează": "Cancel",
  "Povestea misiunii · RO / EN": "Replay the Earth-to-Mars flight",
  "PARCELĂ SELECTATĂ": "PARCEL SELECTED",
  "SELECTEAZĂ ACEASTĂ PARCELĂ": "SELECT THIS PARCEL"
};
export function englishText(text:string){return legacyText[text]??text;}
