export default function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text">{label}</span>
      </div>
      {children}
    </label>
  );
}
