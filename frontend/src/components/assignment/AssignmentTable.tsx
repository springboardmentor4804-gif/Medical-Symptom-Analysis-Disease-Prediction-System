"use client";

import { deleteAssignment } from "@/services/assignment";

interface AssignmentTableProps {
  assignments: any[];
  onRefresh: () => void;
}

export default function AssignmentTable({
  assignments,
  onRefresh,
}: AssignmentTableProps) {

  const handleDelete = async (id: number) => {

    const confirmDelete = confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (!confirmDelete) return;

    try {
      await deleteAssignment(id);

      alert("Assignment deleted successfully.");

      onRefresh();

    } catch (error: any) {

      alert(
        error?.response?.data?.detail ||
        "Failed to delete assignment."
      );

    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">

      <h2 className="mb-6 text-2xl font-bold">
        Current Assignments
      </h2>

      <div className="overflow-x-auto">

        <table className="min-w-full border-collapse">

          <thead>

            <tr className="border-b bg-sky-50">

              <th className="p-3 text-left">
                Doctor
              </th>

              <th className="p-3 text-left">
                Patient
              </th>

              <th className="p-3 text-center">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {assignments.length === 0 ? (

              <tr>

                <td
                  colSpan={3}
                  className="p-6 text-center text-gray-500"
                >
                  No Assignments Found
                </td>

              </tr>

            ) : (

              assignments.map((assignment: any) => (

                <tr
                  key={assignment.id}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="p-4">
                    {assignment.doctor_name}
                  </td>

                  <td className="p-4">
                    {assignment.patient_name}
                  </td>

                  <td className="p-4 text-center">

                    <button
                      onClick={() =>
                        handleDelete(assignment.id)
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}