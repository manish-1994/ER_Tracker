import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWorkbook, Workbook, updateWorkbook } from "../services/workbookService";
import { getWorksheets, Worksheet } from "../services/worksheetService";
import { getRows, Row } from "../services/rowService";
import { PageHeader } from "../components/ui/PageHeader";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberBadge } from "../components/ui/CyberBadge";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberModal } from "../components/ui/CyberModal";
import { CyberInput } from "../components/ui/CyberInput";
import { useToast } from "../context/ToastContext";

const WorkbookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

const fetchWorkbook = async () => {
     if (!id) return null;
     return await getWorkbook(id);
   };

   const fetchWorksheets = async () => {
     if (!id) return [];
     return await getWorksheets(id);
   };

  const fetchTotalRows = async () => {
    if (!id) return 0;
    const worksheets = await getWorksheets(id);
    if (!worksheets || worksheets.length === 0) return 0;
    
    const rowCountPromises = worksheets.map((ws: Worksheet) => 
      getRows(ws.id).then(rows => rows.length)
    );
    const counts = await Promise.all(rowCountPromises);
    return counts.reduce((sum, count) => sum + count, 0);
  };

  const { data: workbook, isLoading: isWorkbookLoading, isError: isWorkbookError, refetch } = useQuery({
    queryKey: ["workbook", id],
    queryFn: fetchWorkbook,
    enabled: !!id,
  });

  const { data: worksheets, isLoading: isWorksheetsLoading } = useQuery({
    queryKey: ["workbook-worksheets", id],
    queryFn: fetchWorksheets,
    enabled: !!id,
  });

  const { data: totalRows, isLoading: isRowsLoading } = useQuery({
    queryKey: ["workbook-total-rows", id],
    queryFn: fetchTotalRows,
    enabled: !!id,
  });

  const isLoading = isWorkbookLoading || isWorksheetsLoading || isRowsLoading;
  const isError = isWorkbookError;

  const toast = useToast();
  const [isEditOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");

  const openEditModal = () => {
    if (!workbook) return;
    setEditName(workbook.name || "");
    setEditDescription(workbook.description || "");
    setEditTags((workbook.tags || []).join(", "));
    setEditOpen(true);
  };

  const closeEditModal = () => setEditOpen(false);

  const saveMetadata = async () => {
    if (!id) return;
    try {
      const tagsArray = editTags.split(",").map(t => t.trim()).filter(t => t);
      await updateWorkbook(id, {
        name: editName,
        description: editDescription,
        tags: tagsArray,
      });
      toast.success("Workbook metadata updated");
      refetch();
      closeEditModal();
    } catch (e: any) {
      toast.error("Failed to update workbook metadata");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workbook Detail" subtitle={id || ""} />
        <div className="p-10 text-center font-sans text-muted animate-pulse border border-accent/15 bg-black/40 rounded-xl">
          Retrieving workbook metadata...
        </div>
      </div>
    );
  }

  if (isError || !workbook) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workbook Detail" subtitle={id || ""} />
        <CyberCard className="p-8 text-center border-danger/40">
          <p className="text-danger font-sans mb-4">[CRITICAL ERROR]: Unable to load workbook data.</p>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Workbook Configuration Node" subtitle={id || ""} />
      
      {/* Workbook Metadata Card */}
      <CyberCard variant="primary" className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md font-bold tracking-widest text-primary uppercase border-b border-accent/25 pb-2">
            Core Metadata
          </h2>
          <CyberButton onClick={openEditModal} variant="secondary" size="sm">
            Edit Metadata
          </CyberButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div>
            <div className="space-y-3">
              <div>
                <span className="text-theme-muted uppercase tracking-wider">Name:</span>
                <span className="ml-2 text-primary font-bold">{workbook.name}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase tracking-wider">Description:</span>
                <span className="ml-2 text-theme-secondary">{workbook.description || "No description provided"}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase tracking-wider">Owner ID:</span>
                <span className="ml-2 text-theme-secondary truncate" title={workbook.owner_id || ""}>
                  {workbook.owner_id ? workbook.owner_id.substring(0, 8) + "..." : "-"}
                </span>
              </div>
              <div>
                <span className="text-theme-muted uppercase tracking-wider">Created:</span>
                <span className="ml-2 text-theme-secondary">{formatDate(workbook.created_at)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-md font-bold tracking-widest text-primary uppercase border-b border-accent/25 pb-2 mb-4">
              Statistics
            </h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-theme-muted uppercase tracking-wider">Sheet Count:</span>
                <CyberBadge variant="success" className="text-lg px-3 py-1">
                  {worksheets?.length || 0}
                </CyberBadge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-theme-muted uppercase tracking-wider">Total Rows:</span>
                <CyberBadge variant="primary" className="text-lg px-3 py-1">
                  {totalRows || 0}
                </CyberBadge>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tags Section */}
        <div className="border-t border-accent/20 pt-4 mt-4">
          <h3 className="text-xs font-bold tracking-widest text-primary uppercase mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {workbook.tags && workbook.tags.length > 0 ? (
              workbook.tags.map((tag, idx) => (
                <CyberBadge key={idx} variant="secondary">
                  {tag}
                </CyberBadge>
              ))
            ) : (
              <span className="text-theme-muted text-xs">No tags assigned</span>
            )}
          </div>
        </div>
      </CyberCard>

      {/* Edit Metadata Modal */}
      <CyberModal isOpen={isEditOpen} onClose={closeEditModal} title="Edit Workbook Metadata">
        <div className="space-y-4 font-sans text-xs">
          <div className="space-y-1">
            <label className="block font-bold text-primary uppercase tracking-wider text-[10px]">
              Workbook Name
            </label>
            <CyberInput
              type="text"
              placeholder="Enter workbook name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-primary uppercase tracking-wider text-[10px]">
              Description
            </label>
            <CyberInput
              type="text"
              placeholder="Enter description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-primary uppercase tracking-wider text-[10px]">
              Tags (comma-separated)
            </label>
            <CyberInput
              type="text"
              placeholder="tag1, tag2, tag3"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-accent/10">
            <CyberButton type="button" onClick={closeEditModal} variant="secondary">
              Cancel
            </CyberButton>
            <CyberButton type="button" onClick={saveMetadata} variant="primary">
              Save
            </CyberButton>
          </div>
        </div>
      </CyberModal>
    </div>
  );
};

export default WorkbookDetail;
