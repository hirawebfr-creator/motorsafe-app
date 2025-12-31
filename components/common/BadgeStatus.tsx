export default function BadgeStatus({ status }: { status: string }) {
  let color = "";
  switch (status) {
    case "Brouillon": color = "badge badge-warning"; break;
    case "En cours": color = "badge badge-accent"; break;
    case "Terminé": color = "badge badge-success"; break;
    case "Facturé": color = "badge badge-accent-2"; break;
    default: color = "badge";
  }
  return <span className={color}>{status}</span>;
}
