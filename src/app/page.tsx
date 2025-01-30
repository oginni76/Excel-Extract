import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="p-6 bg-white shadow-md rounded-md">
        <h1 className="text-xl font-bold text-center mb-4 text-blue-600">Upload an Excel or CSV File</h1>
        <FileUpload />
      </div>
    </div>
  );
}
