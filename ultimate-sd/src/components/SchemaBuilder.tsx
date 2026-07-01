'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  X, 
  Database,
  Key,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Table2,
  Hash,
  Zap
} from 'lucide-react';

interface Field {
  id: string;
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  foreignTable?: string;
}

interface Index {
  id: string;
  name: string;
  fields: string[]; // field ids
  unique?: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

interface Entity {
  id: string;
  name: string;
  fields: Field[];
  indexes: Index[];
  collapsed?: boolean;
}

interface Props {
  value: Entity[];
  onChange: (entities: Entity[]) => void;
  readOnly?: boolean;
}

const FIELD_TYPES = [
  'String', 'Integer', 'BigInt', 'Boolean', 'Date', 'DateTime', 
  'UUID', 'JSON', 'Text', 'Float', 'Enum', 'Array'
];

export default function SchemaBuilder({ value, onChange, readOnly = false }: Props) {
  const [entities, setEntities] = useState<Entity[]>(value.map(e => ({ ...e, indexes: e.indexes || [] })));
  const [newEntityName, setNewEntityName] = useState('');
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  const addEntity = () => {
    if (!newEntityName.trim()) return;
    
    const newEntity: Entity = {
      id: Date.now().toString(),
      name: newEntityName.trim(),
      fields: [],
      indexes: [],
      collapsed: false
    };
    
    const updated = [...entities, newEntity];
    setEntities(updated);
    onChange(updated);
    setNewEntityName('');
    setExpandedEntity(newEntity.id);
  };

  const removeEntity = (entityId: string) => {
    const updated = entities.filter(e => e.id !== entityId);
    setEntities(updated);
    onChange(updated);
  };

  const addField = (entityId: string) => {
    const updated = entities.map(entity => {
      if (entity.id === entityId) {
        const newField: Field = {
          id: Date.now().toString(),
          name: '',
          type: 'String',
          isPrimary: entity.fields.length === 0, // First field is primary by default
        };
        return { ...entity, fields: [...entity.fields, newField] };
      }
      return entity;
    });
    setEntities(updated);
    onChange(updated);
  };

  const updateField = (entityId: string, fieldId: string, updates: Partial<Field>) => {
    const updated = entities.map(entity => {
      if (entity.id === entityId) {
        const fields = entity.fields.map(field => {
          if (field.id === fieldId) {
            return { ...field, ...updates };
          }
          return field;
        });
        return { ...entity, fields };
      }
      return entity;
    });
    setEntities(updated);
    onChange(updated);
  };

  const removeField = (entityId: string, fieldId: string) => {
    const updated = entities.map(entity => {
      if (entity.id === entityId) {
        // Remove field from indexes if present
        const indexes = entity.indexes.map(index => ({
          ...index,
          fields: index.fields.filter(fid => fid !== fieldId)
        })).filter(index => index.fields.length > 0); // Remove empty indexes
        return { ...entity, fields: entity.fields.filter(f => f.id !== fieldId), indexes };
      }
      return entity;
    });
    setEntities(updated);
    onChange(updated);
  };

  const addIndex = (entityId: string) => {
    const updated = entities.map(entity => {
      if (entity.id === entityId) {
        const newIndex: Index = {
          id: Date.now().toString(),
          name: '',
          fields: [],
          unique: false,
          type: 'btree'
        };
        return { ...entity, indexes: [...entity.indexes, newIndex] };
      }
      return entity;
    });
    setEntities(updated);
    onChange(updated);
  };

  const updateIndex = (entityId: string, indexId: string, updates: Partial<Index>) => {
    const updated = entities.map(entity => {
      if (entity.id === entityId) {
        const indexes = entity.indexes.map(index => {
          if (index.id === indexId) {
            return { ...index, ...updates };
          }
          return index;
        });
        return { ...entity, indexes };
      }
      return entity;
    });
    setEntities(updated);
    onChange(updated);
  };

  const removeIndex = (entityId: string, indexId: string) => {
    const updated = entities.map(entity => {
      if (entity.id === entityId) {
        return { ...entity, indexes: entity.indexes.filter(i => i.id !== indexId) };
      }
      return entity;
    });
    setEntities(updated);
    onChange(updated);
  };

  const toggleCollapse = (entityId: string) => {
    const updated = entities.map(entity => {
      if (entity.id === entityId) {
        return { ...entity, collapsed: !entity.collapsed };
      }
      return entity;
    });
    setEntities(updated);
    onChange(updated);
  };

  const getFieldCount = (entity: Entity) => {
    const primary = entity.fields.filter(f => f.isPrimary).length;
    const foreign = entity.fields.filter(f => f.isForeign).length;
    return { total: entity.fields.length, primary, foreign, indexes: entity.indexes.length };
  };

  return (
    <div className="space-y-4">
      {/* Add Entity */}
      <Card className={`p-4 border-2 border-dashed ${readOnly ? 'border-muted-foreground/30 bg-muted/20' : 'border-primary/30 bg-primary/5'}`}>
        <div className="flex gap-2">
          <Input
            value={newEntityName}
            onChange={(e) => setNewEntityName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addEntity();
              }
            }}
            placeholder="Enter entity/table name (e.g., User, Post, Comment)"
            className="flex-1"
            disabled={readOnly}
          />
          <Button onClick={addEntity} disabled={!newEntityName.trim() || readOnly}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </Button>
        </div>
      </Card>

      {/* Entities List */}
      {entities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No entities yet. Add your first table/entity above.</p>
        </div>
      )}

      <div className="space-y-3">
        {entities.map((entity) => {
          const counts = getFieldCount(entity);
          const isExpanded = expandedEntity === entity.id || !entity.collapsed;

          return (
            <Card key={entity.id} className="overflow-hidden border-2">
              {/* Entity Header */}
              <div 
                className={`p-4 bg-gradient-to-r ${readOnly ? 'bg-muted/50' : 'from-primary/10 to-primary/5 hover:bg-primary/15'} border-b border-border ${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
                onClick={() => !readOnly && toggleCollapse(entity.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Table2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{entity.name}</h4>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {counts.total} field{counts.total !== 1 ? 's' : ''}
                        </Badge>
                        {counts.primary > 0 && (
                          <Badge variant="default" className="text-xs bg-blue-500">
                            <Key className="h-3 w-3 mr-1" />
                            {counts.primary} PK
                          </Badge>
                        )}
                        {counts.foreign > 0 && (
                          <Badge variant="default" className="text-xs bg-purple-500">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            {counts.foreign} FK
                          </Badge>
                        )}
                        {counts.indexes > 0 && (
                          <Badge variant="default" className="text-xs bg-green-500">
                            <Hash className="h-3 w-3 mr-1" />
                            {counts.indexes} IDX
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEntity(entity.id);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      disabled={readOnly}
                      aria-label="Remove entity"
                      title="Remove entity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Fields */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {entity.fields.map((field) => (
                    <div key={field.id} className={`flex items-start gap-2 p-3 rounded-lg border group transition-colors ${readOnly ? 'bg-muted/50 border-muted-foreground/20' : 'bg-muted/30 border-border hover:border-primary/50'}`}>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Field Name */}
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(entity.id, field.id, { name: e.target.value })}
                          placeholder="Field name"
                          className="font-mono text-sm"
                          disabled={readOnly}
                        />
                        
                        {/* Field Type */}
                        <select
                          value={field.type}
                          onChange={(e) => updateField(entity.id, field.id, { type: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          disabled={readOnly}
                        >
                          {FIELD_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>

                        {/* Constraints */}
                        <div className="flex gap-2 items-center">
                          <label className={`flex items-center gap-1 text-xs ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-primary'}`}>
                            <input
                              type="checkbox"
                              checked={field.isPrimary || false}
                              onChange={(e) => updateField(entity.id, field.id, { isPrimary: e.target.checked })}
                              className="rounded border-gray-300"
                              disabled={readOnly}
                            />
                            <Key className="h-3 w-3" />
                            PK
                          </label>
                          <label className={`flex items-center gap-1 text-xs ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-primary'}`}>
                            <input
                              type="checkbox"
                              checked={field.isForeign || false}
                              onChange={(e) => updateField(entity.id, field.id, { 
                                isForeign: e.target.checked,
                                foreignTable: e.target.checked ? field.foreignTable || '' : undefined
                              })}
                              className="rounded border-gray-300"
                              disabled={readOnly}
                            />
                            <LinkIcon className="h-3 w-3" />
                            FK
                          </label>
                        </div>
                      </div>

                      {/* Foreign Key Reference */}
                      {field.isForeign && (
                        <div className="w-full md:w-auto md:flex-1">
                          <Input
                            value={field.foreignTable || ''}
                            onChange={(e) => updateField(entity.id, field.id, { foreignTable: e.target.value })}
                            placeholder="References table"
                            className="text-xs"
                            disabled={readOnly}
                          />
                        </div>
                      )}

                      {/* Remove Field */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(entity.id, field.id)}
                        className={`h-9 w-9 p-0 text-red-500 hover:text-red-700 ${readOnly ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                        disabled={readOnly}
                        aria-label="Remove field"
                        title="Remove field"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add Field Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField(entity.id)}
                    className="w-full border-dashed"
                    disabled={readOnly}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              )}

              {/* Indexes */}
              {isExpanded && entity.fields.length > 0 && (
                <div className="p-4 space-y-3 border-t border-border">
                  <h5 className="font-semibold text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Indexes ({entity.indexes.length})
                  </h5>

                  {entity.indexes.map((index) => (
                    <div key={index.id} className={`flex items-start gap-2 p-3 rounded-lg border group transition-colors ${readOnly ? 'bg-muted/50 border-muted-foreground/20' : 'bg-muted/30 border-border hover:border-primary/50'}`}>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Index Name */}
                        <Input
                          value={index.name}
                          onChange={(e) => updateIndex(entity.id, index.id, { name: e.target.value })}
                          placeholder="Index name"
                          className="font-mono text-sm"
                          disabled={readOnly}
                        />
                        
                        {/* Index Type */}
                        <select
                          value={index.type || 'btree'}
                          onChange={(e) => updateIndex(entity.id, index.id, { type: e.target.value as Index['type'] })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          disabled={readOnly}
                        >
                          <option value="btree">B-Tree</option>
                          <option value="hash">Hash</option>
                          <option value="gin">GIN</option>
                          <option value="gist">GiST</option>
                        </select>

                        {/* Fields */}
                        <div className="flex flex-wrap gap-1">
                          {entity.fields.map(field => (
                            <label key={field.id} className={`flex items-center gap-1 text-xs px-2 py-1 rounded border cursor-pointer ${index.fields.includes(field.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary/50'} ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}>
                              <input
                                type="checkbox"
                                checked={index.fields.includes(field.id)}
                                onChange={(e) => {
                                  const newFields = e.target.checked 
                                    ? [...index.fields, field.id]
                                    : index.fields.filter(f => f !== field.id);
                                  updateIndex(entity.id, index.id, { fields: newFields });
                                }}
                                className="hidden"
                                disabled={readOnly}
                              />
                              {field.name || 'Unnamed'}
                            </label>
                          ))}
                        </div>

                        {/* Unique */}
                        <label className={`flex items-center gap-1 text-xs ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-primary'}`}>
                          <input
                            type="checkbox"
                            checked={index.unique || false}
                            onChange={(e) => updateIndex(entity.id, index.id, { unique: e.target.checked })}
                            className="rounded border-gray-300"
                            disabled={readOnly}
                          />
                          Unique
                        </label>
                      </div>

                      {/* Remove Index */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIndex(entity.id, index.id)}
                        className={`h-9 w-9 p-0 text-red-500 hover:text-red-700 ${readOnly ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                        disabled={readOnly}
                        aria-label="Remove index"
                        title="Remove index"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add Index Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addIndex(entity.id)}
                    className="w-full border-dashed"
                    disabled={readOnly}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Index
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {entities.length > 0 && (
        <Card className="p-4 bg-muted/30 border border-border/50">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">{entities.length}</strong> entit{entities.length === 1 ? 'y' : 'ies'} • 
            <strong className="text-foreground ml-2">{entities.reduce((sum, e) => sum + e.fields.length, 0)}</strong> total fields •
            <strong className="text-foreground ml-2">{entities.reduce((sum, e) => sum + e.indexes.length, 0)}</strong> total indexes
          </div>
        </Card>
      )}
    </div>
  );
}
