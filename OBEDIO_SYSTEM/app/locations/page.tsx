'use client';

import { useState } from 'react';
import { useLocations, useLocationTypes } from '@/hooks/use-locations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MapPin, Users, Wifi, Battery, Edit, Trash2, Plus, Home, Anchor, Sun, Waves, Settings, Ship } from 'lucide-react';
import type { Location } from '@/hooks/use-locations';

const deckIcons = {
  'Main Deck': Home,
  'Upper Deck': Anchor,
  'Sun Deck': Sun,
  'Lower Deck': Waves,
  'Bridge Deck': Ship,
  'Beach Deck': Waves
};

const typeColors = {
  cabin: 'bg-blue-500',
  public: 'bg-green-500',
  service: 'bg-yellow-500',
  crew: 'bg-purple-500',
  technical: 'bg-gray-500'
};

export default function LocationsPage() {
  const { locations, loading, error, createLocation, updateLocation, deleteLocation } = useLocations({ includeDevices: true, includeGuests: true });
  const locationTypes = useLocationTypes();
  const { toast } = useToast();
  
  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    deck: '',
    type: 'cabin',
    capacity: 1,
    description: ''
  });

  const decks = Array.from(new Set(locations.map(loc => loc.deck))).sort();
  const filteredLocations = selectedDeck === 'all' 
    ? locations 
    : locations.filter(loc => loc.deck === selectedDeck);

  const handleCreateLocation = async () => {
    try {
      await createLocation(formData);
      toast({
        title: 'Success',
        description: 'Location created successfully'
      });
      setIsAddDialogOpen(false);
      setFormData({ name: '', deck: '', type: 'cabin', capacity: 1, description: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create location',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation) return;
    
    try {
      await updateLocation(editingLocation.id, formData);
      toast({
        title: 'Success',
        description: 'Location updated successfully'
      });
      setEditingLocation(null);
      setFormData({ name: '', deck: '', type: 'cabin', capacity: 1, description: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update location',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return;
    
    try {
      await deleteLocation(deletingLocation.id);
      toast({
        title: 'Success',
        description: 'Location deleted successfully'
      });
      setDeletingLocation(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete location',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      deck: location.deck,
      type: location.type,
      capacity: location.capacity,
      description: location.description || ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground">Manage yacht locations and areas</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>Create a new location on the yacht</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Master Suite"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deck">Deck</Label>
                <Input
                  id="deck"
                  value={formData.deck}
                  onChange={(e) => setFormData({ ...formData, deck: e.target.value })}
                  placeholder="e.g., Main Deck"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLocation}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedDeck} onValueChange={setSelectedDeck} className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="all">All Decks</TabsTrigger>
          {decks.map(deck => (
            <TabsTrigger key={deck} value={deck}>{deck}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedDeck} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map(location => {
              const Icon = deckIcons[location.deck as keyof typeof deckIcons] || MapPin;
              
              return (
                <Card key={location.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{location.name}</CardTitle>
                      </div>
                      <Badge className={`${typeColors[location.type as keyof typeof typeColors]} text-white`}>
                        {location.type}
                      </Badge>
                    </div>
                    <CardDescription>{location.deck}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {location.description && (
                        <p className="text-sm text-muted-foreground">{location.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{location.occupancy || 0}/{location.capacity}</span>
                        </div>
                        {location.devices && location.devices.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Wifi className="h-4 w-4 text-muted-foreground" />
                            <span>{location.devices.length} devices</span>
                          </div>
                        )}
                      </div>

                      {location.guests && location.guests.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium mb-1">Current Guests:</p>
                          <div className="flex flex-wrap gap-1">
                            {location.guests.map((guest: any) => (
                              <Badge key={guest.id} variant="secondary" className="text-xs">
                                {guest.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(location)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingLocation(location)}
                          disabled={(location.devices && location.devices.length > 0) || (location.guests && location.guests.length > 0)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update location details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-deck">Deck</Label>
              <Input
                id="edit-deck"
                value={formData.deck}
                onChange={(e) => setFormData({ ...formData, deck: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLocation(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLocation}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLocation} onOpenChange={(open) => !open && setDeletingLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLocation?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocation}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}