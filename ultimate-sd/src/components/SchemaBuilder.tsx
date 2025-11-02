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
  Table2
} from 'lucide-react';

interface Field {
  id: string;
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  foreignTable?: string;
}

interface Entity {
  id: string;
  name: string;
  fields: Field[];
  collapsed?: boolean;
}

interface Props {
  value: Entity[];
  onChange: (entities: Entity[]) => void;
}

const FIELD_TYPES = [
  'String', 'Integer', 'BigInt', 'Boolean', 'Date', 'DateTime', 
  'UUID', 'JSON', 'Text', 'Float', 'Enum', 'Array'
];

export default function SchemaBuilder({ value, onChange }: Props) {
  const [entities, setEntities] = useState<Entity[]>(value);
  const [newEntityName, setNewEntityName] = useState('');
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  const addEntity = () => {
    if (!newEntityName.trim()) return;
    
    const newEntity: Entity = {
      id: Date.now().toString(),
      name: newEntityName.trim(),
      fields: [],
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
        return { ...entity, fields: entity.fields.filter(f => f.id !== fieldId) };
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
    return { total: entity.fields.length, primary, foreign };
  };

  return (
    <div className="space-y-4">
      {/* Add Entity */}
      <Card className="p-4 border-2 border-dashed border-primary/30 bg-primary/5">
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
          />
          <Button onClick={addEntity} disabled={!newEntityName.trim()}>
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
                className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border cursor-pointer hover:bg-primary/15 transition-colors"
                onClick={() => toggleCollapse(entity.id)}
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
                    <div key={field.id} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border group hover:border-primary/50 transition-colors">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Field Name */}
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(entity.id, field.id, { name: e.target.value })}
                          placeholder="Field name"
                          className="font-mono text-sm"
                        />
                        
                        {/* Field Type */}
                        <select
                          value={field.type}
                          onChange={(e) => updateField(entity.id, field.id, { type: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {FIELD_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>

                        {/* Constraints */}
                        <div className="flex gap-2 items-center">
                          <label className="flex items-center gap-1 text-xs cursor-pointer hover:text-primary">
                            <input
                              type="checkbox"
                              checked={field.isPrimary || false}
                              onChange={(e) => updateField(entity.id, field.id, { isPrimary: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <Key className="h-3 w-3" />
                            PK
                          </label>
                          <label className="flex items-center gap-1 text-xs cursor-pointer hover:text-primary">
                            <input
                              type="checkbox"
                              checked={field.isForeign || false}
                              onChange={(e) => updateField(entity.id, field.id, { 
                                isForeign: e.target.checked,
                                foreignTable: e.target.checked ? field.foreignTable || '' : undefined
                              })}
                              className="rounded border-gray-300"
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
                          />
                        </div>
                      )}

                      {/* Remove Field */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(entity.id, field.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 p-0 text-red-500 hover:text-red-700"
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
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
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
            <strong className="text-foreground ml-2">{entities.reduce((sum, e) => sum + e.fields.length, 0)}</strong> total fields
          </div>
        </Card>
      )}
    </div>
  );
}
